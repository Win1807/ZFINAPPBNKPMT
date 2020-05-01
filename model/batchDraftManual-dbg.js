/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
/*global Promise */
sap.ui.define([
	"zfin/ap/zapprovebankpayments/model/Messaging"
], function(Messaging) {
	"use strict";

	var _oMessaging = Messaging;
	var _oResourceBundle;

	function _activateDraft(oBatchContext, authCode) {
		var batchId = oBatchContext.getProperty("PaymentBatch");
		var urlParameters = {
			PaymentBatch: batchId,
			DraftUUID: oBatchContext.getProperty("DraftUUID"),
			IsActiveEntity: false
		};
		
		if (authCode) {
			urlParameters.Token = "'" + authCode + "'";
		}
		
		return new Promise(function(fnResolve, fnReject) {
			oBatchContext.getModel().callFunction(
				"/C_AbpPaymentBatchActivation", {
					changeSetId: oBatchContext.getPath(),
					method: "POST",
					urlParameters: urlParameters,
					success: fnResolve,
					error: fnReject
				});
		});
	}

	function _hardUndoBatch(oBatchContext) {
		var batchPath = oBatchContext.getPath();
		return new Promise(function(fnResolve, fnReject) {
			oBatchContext.getModel().remove(batchPath, {
				success: fnResolve,
				error: fnReject,
				changeSetId: batchPath
			});
		});
	}

	function _updateModel(oDataModel, sBatchPath, value) {
		return new Promise(function(fnResolve, fnReject) {
			oDataModel.update(sBatchPath, value, {
				changeSetId: sBatchPath,
				success: function() {
					fnResolve({
						path: sBatchPath
					});
				},
				error: fnReject
			});
		});
	}

	function _unprocessBatch(oBatchContext) {
		var value = {
			PaymentBatchIsProcessed: false,
			PaymentBatchAction: "",
			Note: ""
		};

		return _updateModel(oBatchContext.getModel(), oBatchContext.getPath(), value);
	}

	function _undoBatch(oBatchContext, action) {
		return action.unprocessOnly ? _unprocessBatch(oBatchContext) : _hardUndoBatch(oBatchContext);
	}

	function _createDraft(oBatchContext, bTakeOver) {
		return new Promise(function(fnResolve, fnReject) {
			oBatchContext.getModel().callFunction(
				"/C_AbpPaymentBatchEdit", {
					changeSetId: oBatchContext.getPath(),
					method: "POST",
					urlParameters: {
						PaymentBatch: oBatchContext.getProperty("PaymentBatch"),
						DraftUUID: oBatchContext.getProperty("DraftUUID"),
						IsActiveEntity: true,
						PreserveChanges: !bTakeOver
					},
					success: fnResolve,
					error: fnReject
				});
		});
	}

	function _setProcessed(oDataModel, sBatchPath, oAction) {
		var value = {
			PaymentBatchIsProcessed: true,
			PaymentBatchAction: oAction.action,
			Note: oAction.note
		};

		if (oAction.isDefer) {
			value.PaymentBatchDeferDate = oAction.deferDate;
		}

		return _updateModel(oDataModel, sBatchPath, value);
	}
	


	function _wrapBatchActionPromises(aBatchContexts, fnAction, resourceKey, extraParam) {
		var aPromises = [];
		aBatchContexts.forEach(function(oBatchContext) {
			aPromises.push(new Promise(function(fnResolve, fnReject) {
				var batchId = oBatchContext.getProperty("PaymentBatch");
				fnAction(oBatchContext, extraParam)
					.then(fnResolve)
					.catch(function(oError) {
						_oMessaging.addErrorMessage(_oResourceBundle.getText(resourceKey, batchId), oError);
						fnReject(oError);
					});
			}));
		});

		return Promise.all(aPromises);
	}

	function _processBatch(oBatchContext, oAction, bTakeOver) {
		if (oBatchContext.getProperty("IsActiveEntity")) {
			return _createDraft(oBatchContext, bTakeOver)
				.then(function(oData) {
					var sPath = "/C_AbpPaymentBatch(PaymentBatch='" + oData.PaymentBatch +
						"',DraftUUID=guid'" + oData.DraftUUID +
						"',IsActiveEntity=" + oData.IsActiveEntity + ")";

					return _setProcessed(oBatchContext.getModel(), sPath, oAction);
				});
		}

		return _setProcessed(oBatchContext.getModel(), oBatchContext.getPath(), oAction);
	}

	return {
		setResourceBundle: function(oBundle) {
			_oResourceBundle = oBundle;
		},

		editBatch: function(oBatchContext, bTakeOver) {
			return _createDraft(oBatchContext, bTakeOver);
		},

		update: function(oContext, oValue) {
			var sPath = oContext.getPath();
			return new Promise(function(fnResolve, fnReject) {
				oContext.getModel().update(sPath, oValue, {
					changeSetId: sPath,
					success: fnResolve,
					error: fnReject
				});
			});
		},

		processBatch: function(oBatchContext, oAction, bTakeOver) {
			return _processBatch(oBatchContext, oAction, bTakeOver);
		},

		processBatches: function(aBatchContexts, oAction, bTakeOver) {
			return _wrapBatchActionPromises(
				aBatchContexts,
				function(oBatchContext) {
					return _processBatch(oBatchContext, oAction, bTakeOver);
				},
				"editBatchFailure");
		},

		submitReviewed: function(aBatchContexts, authCode) {
			return _wrapBatchActionPromises(aBatchContexts, _activateDraft, "submitBatchFailure", authCode);
		},

		undoBatch: function(oBatchContext, action) {
			return _undoBatch(oBatchContext, action);
		},

		undoBatches: function(aBatchContexts, action) {
			return _wrapBatchActionPromises(aBatchContexts, _undoBatch, "undoBatchChagesFailure", action);
		}
	};
});