/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
/*global Promise */
sap.ui.define([
	"zfin/ap/zapprovebankpayments/model/batchDraft",
	"zfin/ap/zapprovebankpayments/model/Messaging",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"zfin/ap/zapprovebankpayments/controller/detail/DialogFactory"
], function(BatchDraft, Messaging, Filter, FilterOperator, DialogFactory) {
	"use strict";

	var _oBatchDraft = BatchDraft;
	var _dialogFactory = DialogFactory;
	var _messaging = Messaging;
	var _oResourceBundle;
	var _oView;

	function _publishBatchEdited(batchId) {
		_messaging.publishEvent(_messaging.eventName.BATCH_ACTION, {
			id: batchId
		});
	}

	function _hasUnsavedChanges(oContext) {
		return oContext.getProperty("HasDraftEntity") === true &&
			!oContext.getProperty("DraftAdministrativeData/InProcessByUser");
	}

	function _takeOverWarning(oView) {
		var model = {
			userName: oView.getBindingContext().getProperty("DraftAdministrativeData/LastChangedByUserDescription")
		};

		return _dialogFactory.askTakeOver(oView, model);
	}

	function _confirmAction(sAction, oBindingContext, oView, items) {
		var defer = _dialogFactory.getDeferSettings();
		return _dialogFactory.askConfirmBatchAction(
			oView, {
				action: sAction,
				isDefer: sAction === "def",
				isReject: sAction === "rej",
				deferDate: defer.date,
				deferMinDate: defer.minDate,
				note: ""
			},
			oBindingContext,
			items);
	}

	function _onActionFailure(error) {
		if (error) { // not just dialog -> cancel
			_messaging.addActionError(error);
			_messaging.actionFinished();
		}
	}

	function _navigate(extensionAPI, model, path, navigation) {
		var navigationData = Object.assign({
			replaceInHistory: true
		}, navigation);

		var navControl = extensionAPI.getNavigationController();
		var existingContext = model.createBindingContext(path, function(fetchedContext) {
			navControl.navigateInternal(fetchedContext, navigationData);
		});

		if (existingContext) {
			navControl.navigateInternal(existingContext, navigationData);
		}
	}

	function _navigateToPayment(extensionAPI, model, path) {
		var navigationData = {
			navigationProperty: "to_Payment"
		};
		_navigate(extensionAPI, model, path, navigationData);
	}

	function _navigateToBatch(extensionAPI, model, path) {
		return new Promise(function(fnResolve) {
			var tablePath = _oView.createId("Payments::responsiveTable");
			if (tablePath.indexOf("C_AbpPaymentBatch") === -1) {
				tablePath = tablePath.replace("C_AbpPayment", "C_AbpPaymentBatch");
			}

			var table = sap.ui.getCore().byId(tablePath);
			
			// once for invalidate, once for real update
			table.attachEventOnce("updateFinished", function(event) {
				event.getSource().attachEventOnce("updateFinished", function() {
					fnResolve();
				});
			});
			_navigate(extensionAPI, model, path);
		});
	}

	function _createPath(model, entitySet, keys) {
		return "/" + model.createKey(entitySet, keys);
	}

	function _createBatchPath(context, sPaymentBatch, sDraftUUID) {
		var keys = {
			PaymentBatch: sPaymentBatch,
			DraftUUID: sDraftUUID,
			IsActiveEntity: false
		};
		return _createPath(context.getModel(), "C_AbpPaymentBatch", keys);
	}

	function _createPaymentPath(context, sPaymentBatch, sPaymentBatchItem, sDraftUUID) {
		var keys = {
			PaymentBatch: sPaymentBatch,
			PaymentBatchItem: sPaymentBatchItem,
			DraftUUID: sDraftUUID,
			IsActiveEntity: false
		};
		return _createPath(context.getModel(), "C_AbpPayment", keys);
	}

	var _getNewDraftPayment = function(oBatchContext, extensionAPI, oPayment, sPath) {
		return new Promise(function(fnResolve, fnReject) {
			var filter = new Filter({
				path: "PaymentBatchItem",
				operator: FilterOperator.EQ,
				value1: oPayment.getObject().PaymentBatchItem
			});
			oPayment.getModel().read(sPath + "/to_Payment", {
				filters: [filter],
				success: fnResolve
			});
		});
	};

	var _handleNavigationToDraftPayment = function(oBatchContext, extensionAPI, sPath, response) {
		var draftPayment = response.results[0];
		var sPaymentPath = _createPaymentPath(oBatchContext, draftPayment.PaymentBatch, draftPayment.PaymentBatchItem,
			draftPayment.DraftUUID, false);
		return _navigateToBatch(extensionAPI, oBatchContext.getModel(), sPath)
			.then(_navigateToPayment.bind(null, extensionAPI, oBatchContext.getModel(), sPaymentPath));
	};

	var _startNavigationToDraftDetailPage = function(oBatchContext, extensionAPI, oPayment, draftBatch) {
		var sPath = _createBatchPath(oBatchContext, draftBatch.PaymentBatch, draftBatch.DraftUUID, false);


		if (oPayment) {
			return _getNewDraftPayment(oBatchContext, extensionAPI, oPayment, sPath)
				.then(_handleNavigationToDraftPayment.bind(null, oBatchContext, extensionAPI, sPath));
		} else {
			return _navigateToBatch(extensionAPI, oBatchContext.getModel(), sPath);
		}
	};

	var _enterEditMode = function(oBatchInfo, extensionAPI, bTakeOver, oPayment) {
		return new Promise(function(fnResolve, fnReject) {
			var oBatchContext = oBatchInfo.batchContext;

			_oBatchDraft.editBatch(oBatchContext, bTakeOver)
				.then(_startNavigationToDraftDetailPage.bind(null, oBatchContext, extensionAPI, oPayment)).then(function() {
					_publishBatchEdited(oBatchContext.getProperty("PaymentBatch"));
					_messaging.actionFinished(_oResourceBundle.getText("editBatchSuccess", oBatchContext.getProperty("PaymentBatch")));
					fnResolve();
				}).catch(fnReject);
		});
	};

	var _createDraft = function(oBatchInfo, extensionAPI, bTakeOver, oPayment) {
		return new Promise(function(fnResolve, fnReject) {
			_messaging.actionStarted(_oResourceBundle.getText("editBatchAction"));
			return extensionAPI.securedExecution(_enterEditMode.bind(null, oBatchInfo, extensionAPI, bTakeOver, oPayment));
		});
	};

	var _callProcessBatch = function(oBatchContext, oAction, oView, extensionAPI, bTakeOver) {
		var batchId = oBatchContext.getProperty("PaymentBatch");
		var wasDraft = !oBatchContext.getProperty("IsActiveEntity");
		return new Promise(function(fnResolve, fnReject) {
			_messaging.actionStarted(_oResourceBundle.getText("editBatchAction"));
			extensionAPI.securedExecution(_oBatchDraft.processBatch.bind(null, oBatchContext, oAction, bTakeOver))
				.then(function(context) {
					_messaging.actionFinished(_oResourceBundle.getText("editBatchSuccess", batchId));
					if (wasDraft) {
						oBatchContext.getModel().refresh();
					} else {
						_navigateToBatch(
							extensionAPI,
							oBatchContext.getModel(),
							context.path);
					}

					_publishBatchEdited(batchId);
					fnResolve();
				})
				.catch(fnReject);
		});
	};



	var _processBatchWithTakeover = function(oBatchContext, oAction, oView, extensionAPI) {
		return _callProcessBatch(oBatchContext, oAction, oView, extensionAPI, true)
			.catch(_onActionFailure);
	};

	var _processBatch = function(oBatchContext, oAction, oView, extensionAPI) {
		return _callProcessBatch(oBatchContext, oAction, oView, extensionAPI, false)
			.catch(function(oError) {
				if (_oBatchDraft.isUnsavedChangesError(oError)) {
					_takeOverWarning(oView).then(function() {
							return _processBatchWithTakeover(oBatchContext, oAction, oView, extensionAPI);
						})
						.catch(_onActionFailure);
				} else {
					_onActionFailure(oError);
				}
			});
	};

	var _updateObject = function(model, path) {
		return new Promise(function(fnResolve, fnReject) {
			model.invalidateEntry(path);
			model.read(path, {
				success: fnResolve,
				error: fnReject
			});
		});
	};

	return {
		setResourceBundle: function(oResourceBundle) {
			_oResourceBundle = oResourceBundle;
			_oBatchDraft.setResourceBundle(oResourceBundle);
		},

		setView: function(oView) {
			_oView = oView;
		},

		editableBatch: function(oBatchInfo, oView, extensionAPI, oPayment) {
			_oView = oView;
			if (_hasUnsavedChanges(oBatchInfo.batchContext)) {
				return _takeOverWarning(oView)
					.then(function(oAction) {
						return _createDraft(oBatchInfo, extensionAPI, true, oPayment);
					})
					.catch(_onActionFailure);
			} else {
				return _createDraft(oBatchInfo, extensionAPI, false, oPayment)
					.catch(function(oError) {
						if (_oBatchDraft.isUnsavedChangesError(oError)) {
							_takeOverWarning(oView).then(function() {
									return _createDraft(oBatchInfo, extensionAPI, true, oPayment);
								})
								.catch(_onActionFailure);
						} else {
							_onActionFailure(oError);
						}
					});
			}
		},

		processBatch: function(oBatchInfo, oView, extensionAPI) {
			if (_hasUnsavedChanges(oBatchInfo.batchContext)) {
				_takeOverWarning(oView)
					.then(function() {
						return _confirmAction(oBatchInfo.action, oBatchInfo.batchContext, oView, oBatchInfo.items);
					})
					.then(function(oAction) {
						return _processBatchWithTakeover(oBatchInfo.batchContext, oAction, oView, extensionAPI);
					})
					.catch(_onActionFailure);
			} else {
				_confirmAction(oBatchInfo.action, oBatchInfo.batchContext, oView, oBatchInfo.items)
					.then(function(oAction) {
						return _processBatch(oBatchInfo.batchContext, oAction, oView, extensionAPI);
					});
			}
		},

		undoBatchWithMessages: function(oBatchContext, oView, extensionAPI) {
			var batchId = oBatchContext.getProperty("PaymentBatch");
			_dialogFactory.askConfirmUndo(oView, oBatchContext)
				.then(function(undoInfo) {
					_messaging.actionStarted(_oResourceBundle.getText("masterSelectedBatchesUndo"));
					extensionAPI.securedExecution(_oBatchDraft.undoBatch.bind(null, oBatchContext, undoInfo))
						.then(function() {
							var activePath;
							if (!undoInfo.unprocessOnly) {
								_messaging.actionFinished(_oResourceBundle.getText("undoBatchChagesSuccess", batchId));
								activePath = "/" + oBatchContext.getModel().createKey("C_AbpPaymentBatch", {
									PaymentBatch: batchId,
									DraftUUID: "00000000-0000-0000-0000-000000000000",
									IsActiveEntity: true
								});
								_navigateToBatch(
										extensionAPI,
										oBatchContext.getModel(),
										activePath)
									.then(function() {
										_publishBatchEdited(batchId);
									});
							} else {
								_messaging.actionFinished(_oResourceBundle.getText("undoBatchMoveSuccess", batchId));
								var bvb = oView.getElementBinding();
								oBatchContext.getModel().invalidateEntry(oBatchContext);
								bvb.refresh();
								_publishBatchEdited(batchId);
							}
						})
						.catch(_onActionFailure);
				})
				.catch(_onActionFailure);
		},

		update: function(aPaymentsContexts, oBatchContext, updateModel, extensionAPI) {
			_messaging.actionStarted(_oResourceBundle.getText("editPaymentAction"));
			return extensionAPI.securedExecution(function() {
					var promises = aPaymentsContexts.map(function(context) {
						return _oBatchDraft.update(context, updateModel);
					});

					if (!oBatchContext.getProperty("PaymentBatchIsEdited")) {
						promises.push(_oBatchDraft.update(oBatchContext, {
							PaymentBatchIsEdited: true
						}));
					}

					return Promise.all(promises);
				}).then(function() {
					var path = oBatchContext.getPath();
					var model = aPaymentsContexts[0].getModel();
					return new Promise(function(fnResolve, fnReject) {
						var aPromises = [];
						aPromises.push(_updateObject(model, path));
						aPromises.concat(aPaymentsContexts.map(function(paymentContext) {
							return _updateObject(model, paymentContext.getPath());
						}));

						Promise.all(aPromises).then(function(responses) {
							var payment = {
								text: aPaymentsContexts.length > 1 ? "editPaymentsSuccess" : "editPaymentSuccess",
								param: aPaymentsContexts.length > 1 ? aPaymentsContexts.length : aPaymentsContexts[0].getProperty("PaymentDocument")
							};
							_messaging.actionFinished(_oResourceBundle.getText(payment.text, payment.param));
							fnResolve(responses[0]);
						});
					});
				})
				.catch(_onActionFailure);
		},

		updateWithBatchMessages: function(oContext, updateModel) {
			var batchId = oContext.getProperty("PaymentBatch");
			_messaging.actionStarted(_oResourceBundle.getText("editBatchAction"));
			return _oBatchDraft.update(oContext, updateModel)
				.then(function() {
					_messaging.actionFinished(_oResourceBundle.getText("editBatchSuccess", batchId));
					return updateModel;
				})
				.catch(_onActionFailure);
		}
	};
});