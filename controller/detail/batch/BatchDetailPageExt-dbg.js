/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/model/json/JSONModel",
	"sap/m/Button",
	"zfin/ap/zapprovebankpayments/model/formatter",
	"zfin/ap/zapprovebankpayments/model/Messaging",
	"zfin/ap/zapprovebankpayments/model/PaymentListModel",
	"zfin/ap/zapprovebankpayments/controller/detail/DraftController",
	"zfin/ap/zapprovebankpayments/controller/detail/DialogFactory"
	/* eslint-disable max-params */
], function(
	BaseObject,
	JSONModel,
	Button,
	formatter,
	Messaging,
	PaymentListModel,
	BatchDraftController,
	DialogFactory
) {
	/* eslint-enable */
	"use strict";

	var paymentListModel = PaymentListModel;

	var _oBatchViewModel = new JSONModel({
		timeline: [],
		approveActionAvailable: false,
		firstStageActionsAvailable: false,
		nextStageActionsAvailable: false,
		draftStageActionsAvailable: false,
		canManagePayments: false,
		isEditable: false,
		attachmentSelected: false,
		paymentsActionAvailable: false,
		paymentTableSelectable: false
	});

	var approvals = {
		future: {
			icon: "employee-lookup",
			action: "batchTimelineNextStep",
			message: "batchTimelineNextApprovers"
		},
		current: {
			icon: "approvals",
			action: "batchTimelineWaitingForApproval",
			message: "batchTimelineCurrentApprovers"
		}
	};

	function _expandCollectionPropery(object, context, property) {
		var collection = object[property];
		var source = context && collection ? context.getProperty(property) : undefined;

		if (source) {
			collection = source.map(function(path) {
				return context.getModel().getObject("/" + path);
			});
		}

		return collection;
	}

	function _addSeparators(aItems) {
		var i;
		var separator = ",";

		for (i = 0; i + 1 < aItems.length; i++) {
			aItems[i].Suffix = separator;
		}

		return aItems;
	}

	var BatchDetailPageExt = BaseObject.extend("zfin.ap.zapprovebankpayments.controller.detail.batch.BatchDetailPageExt", {
		constructor: function(component, view, extensionAPI) {
			this.component = component;
			this.view = view;
			this.extensionAPI = extensionAPI;
			this.formatter = formatter;
			this.draftController = BatchDraftController;
			this.dialogFactory = DialogFactory;
			this.messaging = Messaging;
		}
	});

	BatchDetailPageExt.prototype.onInit = function() {
		this.table = this.view.byId("Payments::responsiveTable");
		this.paymentsTable = this.view.byId("Payments::Table");
		this._setupBatchPage();
		this.component.setModel(_oBatchViewModel, "batchView");
		this._oResourceBundle = this.component.getModel("@i18n").getResourceBundle();
		this.draftController.setResourceBundle(this._oResourceBundle);
		this.draftController.setView(this.view);
		this.extensionAPI.attachPageDataLoaded(this.onBatchDataLoaded.bind(this));
		this._addActionButton();
		this._bindActionButtons();
		this.table.attachSelectionChange(this.onPaymentsTableSelectionChange.bind(this));
		this.table.attachUpdateFinished(this.onPaymentsTableSelectionChange.bind(this));
		this.messaging.subscribeEvent(this.messaging.eventName.PAYMENT_CHANGE, this.busSubscriber, this);
		this._setupExtraBinding();
	};

	BatchDetailPageExt.prototype._setupExtraBinding = function() {
		var excludedSection = this.view.byId("ExcludedPayments::Section");
		var visibleProp = "visible";
		this.table.bindProperty("mode", {
			path: "batchView>/paymentTableSelectable",
			formatter: this.formatter.tableMode
		});

		this.view.bindElement({
			path: "",
			parameters: {
				expand: "GetHistory,GetApproverList,GetFutureApproverList,GetAttachment,DraftAdministrativeData"
			},
			events: {
				dataReceived: function(event) {
					var batch = event.getParameter("data");
					this._onBatchDataReady(batch);
				}.bind(this)
			}
		});

		if (excludedSection) {
			excludedSection.bindProperty(visibleProp, {
				path: "IsReturnedApproval",
				formatter: function(val) {
					return !!val;
				}
			});
		}
	};

	BatchDetailPageExt.prototype._addActionButton = function() {
		var toolbar = this.paymentsTable.getToolbar();
		var addNewButtonIntoToolbar = function(button) {
			toolbar.addContent(this._createButton(
				this._oResourceBundle.getText(button.text), button.action.bind(this)));
		};
		var buttons = [{
			text: "batchPaymentsHeaderButtonTitleEditInstructionKey",
			action: this.onEditInstructionKey
		}, {
			text: "batchPaymentsHeaderButtonTitleSetToReject",
			action: this.onRejectPress
		}, {
			text: "batchPaymentsHeaderButtonTitleSetToDefer",
			action: this.onDeferPress
		}, {
			text: "batchPaymentsHeaderButtonTitleResetStatus",
			action: this.onResetStatusPress
		}];

		buttons.forEach(addNewButtonIntoToolbar.bind(this));
	};

	BatchDetailPageExt.prototype._createButton = function(text, action) {
		return new Button({
			text: text,
			press: action.bind(this),
			enabled: "{= ${batchView>/isEditable} && ${batchView>/paymentsActionAvailable}}",
			visible: "{batchView>/firstStageActionsAvailable}"
		});
	};

	BatchDetailPageExt.prototype._bindActionButtons = function() {
		["action::rejectBatch", "action::deferBatch"].forEach(function(buttonId) {
			var button = this.view.byId(buttonId);

			if (button) {
				button.bindProperty("enabled", {
					path: "batchView>/canManagePayments"
				});
			}
		}.bind(this));
	};

	BatchDetailPageExt.prototype.onExit = function() {
		this.extensionAPI.detachPageDataLoaded(this.onBatchDataLoaded.bind(this));
		this.messaging.unsubscribeEvent(this.messaging.eventName.PAYMENT_CHANGE, this.busSubscriber, this);
	};

	BatchDetailPageExt.prototype.onBatchDataLoaded = function(oEvent) {
		var context = oEvent.context;
		this._onBatchDataReady(context.getObject(), context);
	};

	BatchDetailPageExt.prototype.onProcessBatch = function(sAction) {
		var batchInfo = {
			batchContext: this._getCurrentContext(),
			action: sAction,
			items: this.table.getItems()
		};

		this.draftController.processBatch(batchInfo, this.view, this.extensionAPI);
	};

	BatchDetailPageExt.prototype.onUndoBatch = function() {
		this.draftController.undoBatchWithMessages(this._getCurrentContext(), this.view, this.extensionAPI);
	};

	BatchDetailPageExt.prototype.onPaymentsTableSelectionChange = function() {
		_oBatchViewModel.setProperty("/paymentsActionAvailable", this.table.getSelectedItems().length > 0);
	};

	BatchDetailPageExt.prototype.onEditBatch = function() {
		var batchInfo = {
			batchContext: this._getCurrentContext()
		};

		this.draftController.editableBatch(batchInfo, this.view, this.extensionAPI);
	};

	BatchDetailPageExt.prototype.busSubscriber = function(channel, event, data) {
		this._computeViewModel(data.batch, this._getCurrentContext());
	};

	BatchDetailPageExt.prototype.onEditInstructionKey = function() {
		var aContext = this._getSelectedItemsContext();
		this.dialogFactory.askEditInstructionKey(this.view, aContext)
			.then(function(sKey) {
				this._updateSelectedPayments({
					DataExchangeInstruction: sKey
				});
			}.bind(this));
	};

	BatchDetailPageExt.prototype._getSelectedItemsContext = function() {
		var fnItemToPath = function(oItem) {
			return oItem.getBindingContext();
		};

		return this.table.getSelectedItems().map(fnItemToPath);
	};

	BatchDetailPageExt.prototype._getSelectedItemsKeys = function() {
		var fnItemToPath = function(oItem) {
			return oItem.getBindingContext().getProperty("PaymentBatchItem");
		};

		return this.table.getSelectedItems().map(fnItemToPath);
	};

	BatchDetailPageExt.prototype.onRejectPress = function() {
		this._updateSelectedPayments({
			PaymentAction: "rej"
		});
	};

	BatchDetailPageExt.prototype.onResetStatusPress = function() {
		this._updateSelectedPayments({
			PaymentAction: "",
			Status: "IBC01",
			PaymentDeferDate: null
		});
	};

	BatchDetailPageExt.prototype._updateSelectedPayments = function(oValue) {
		var aContexts = this._getSelectedItemsContext();
		this.draftController.update(aContexts, this._getCurrentContext(), oValue, this.extensionAPI)
			.then(function(batch) {
				var stageInfo = this._getStageinfo(batch, this._getCurrentContext());
				_oBatchViewModel.setProperty("/canManagePayments", stageInfo.isFirstStage && stageInfo.isUnlocked && !stageInfo.oBatch.PaymentBatchIsEdited);
				this.messaging.publishEvent(this.messaging.eventName.PAYMENT_TABLE_CHANGE, {
					batch: batch
				});
			}.bind(this));
	};

	BatchDetailPageExt.prototype.onDeferPress = function() {
		this.dialogFactory.askDeferDate(this.view)
			.then(function(date) {
				this._updateSelectedPayments({
					PaymentAction: "def",
					PaymentDeferDate: date
				});
			}.bind(this));
	};

	BatchDetailPageExt.prototype._getCurrentContext = function() {
		return this.view.getBindingContext();
	};

	BatchDetailPageExt.prototype._onBatchDataReady = function(batch, context) {
		this._computeViewModel(batch, context);

		if (context) {
			this.dialogFactory.checkDeferDaysPeriod(context);
		}
	};

	BatchDetailPageExt.prototype._computeViewModel = function(batch, context) {
		var attachments = this._getAttachments(batch, context);
		var stageInfo = this._getStageinfo(batch, context);
		_oBatchViewModel.setProperty("/attachments", attachments);
		_oBatchViewModel.setProperty("/isEditable", !batch.IsActiveEntity && !batch.PaymentBatchIsProcessed);
		_oBatchViewModel.setProperty("/paymentTableSelectable", !batch.IsActiveEntity && !batch.PaymentBatchIsProcessed && stageInfo.isNew);
		_oBatchViewModel.setProperty("/batchEditable", batch.IsActiveEntity && stageInfo.isUnlocked);
		_oBatchViewModel.setProperty("/paymentsActionAvailable", this.table.getSelectedItems().length > 0);
		_oBatchViewModel.setProperty("/approveActionAvailable", stageInfo.isFirstStage || stageInfo.isNextStage);
		_oBatchViewModel.setProperty("/firstStageActionsAvailable", stageInfo.isFirstStage);
		_oBatchViewModel.setProperty("/nextStageActionsAvailable", stageInfo.isNextStage);
		_oBatchViewModel.setProperty("/draftStageActionsAvailable", stageInfo.isReviewedStage);
		_oBatchViewModel.setProperty("/canManagePayments", stageInfo.isFirstStage && stageInfo.isUnlocked && !stageInfo.oBatch.PaymentBatchIsEdited);
		_oBatchViewModel.setProperty("/timeline", this._getEvents(batch, context));
	};

	BatchDetailPageExt.prototype._getStageinfo = function(batch, context) {
		var isNew = batch && batch.ApprovalIsFirst || batch.IsReturnedApproval;
		var isNotProcessed = batch && !batch.PaymentBatchIsProcessed;
		return {
			isNew: isNew,
			isNotProcessed: isNotProcessed,
			isFirstStage: isNotProcessed && isNew,
			isNextStage: isNotProcessed && !isNew,
			isReviewedStage: batch && !batch.IsActiveEntity,
			isUnlocked: batch && (!batch.IsActiveEntity ||
				!batch.HasDraftEntity ||
				!this._getLockUser(batch, context)),
			oBatch: batch
		};
	};

	BatchDetailPageExt.prototype._getLockUser = function(batch, context) {
		var lockUser;
		if (context) {
			lockUser = context.getProperty("DraftAdministrativeData/InProcessByUser");
		} else {
			lockUser = batch.DraftAdministrativeData ? batch.DraftAdministrativeData.InProcessByUser : undefined;
		}

		return lockUser;
	};

	BatchDetailPageExt.prototype._setupBatchPage = function() {
		var oPage = this.view.byId("objectPage");

		if (oPage) {
			var header = oPage.getHeaderTitle();
			header.bindProperty("objectTitle", {
				parts: [{
					path: "PaymentBatch"
				}],
				formatter: this.formatter.paymentBatchTitle
			});

			header.unbindProperty("objectSubtitle");
		}

		this._setupPaymentsTable(this.paymentsTable, paymentListModel.standardSettings);
		this._setupPaymentsTable(this.view.byId("ExcludedPayments::Table"), paymentListModel.excludeSettings);
	};

	BatchDetailPageExt.prototype._setupPaymentsTable = function(table, settings) {
		if (table) {
			table.setRequestAtLeastFields(settings.requestAtLeast);
			table.setIgnoredFields(settings.ignored);
			table.setUseExportToExcel(true);
			table.setUseVariantManagement(true);
		}
	};

	BatchDetailPageExt.prototype._getAttachments = function(batch, context) {
		var attachmentsSource = _expandCollectionPropery(batch, context, "GetAttachment");
		var attachments = [];

		if (attachmentsSource && attachmentsSource.length) {
			attachments = attachmentsSource.map(function(a) {
				a.DownloadUrl = "/sap/opu/odata/sap/FAP_APPROVEBANKPAYMENTS_SRV/AttachmentDownloadSet(ID='" + a.AttachmId + "')/$value";
				return a;
			});
		}

		return attachments;
	};

	BatchDetailPageExt.prototype._getEvents = function(batch, context) {
		var history = _expandCollectionPropery(batch, context, "GetHistory");
		var currentApprovers = _expandCollectionPropery(batch, context, "GetApproverList");
		var futureApprovers = _expandCollectionPropery(batch, context, "GetFutureApproverList");
		var events = [];

		if (history) {
			events = this._getFutureEvents(futureApprovers, currentApprovers).concat(history);
		}

		return events;
	};

	BatchDetailPageExt.prototype._getFutureEvents = function(futureApprovers, currentApprovers) {
		var now = new Date();
		var futureDate = new Date(now.getTime() + 1000);

		var events = [
			this._createApproversEvent(futureApprovers, approvals.future, futureDate),
			this._createApproversEvent(currentApprovers, approvals.current, now)
		];

		return events.filter(function(event) {
			return event;
		});
	};

	BatchDetailPageExt.prototype._getApproversEventItems = function(aApprovers, sPrefix, threshold) {
		var items = aApprovers.slice(0, threshold);

		if (aApprovers.length > threshold) {
			items.push({
				FullName: this._oResourceBundle.getText("batchTimelineRemainigApprovers", [aApprovers.length - threshold]),
				Approvers: aApprovers.slice(threshold)
			});
		}

		items = _addSeparators(items);

		if (sPrefix) {
			items.unshift({
				Prefix: sPrefix
			});
		}

		return items;
	};

	BatchDetailPageExt.prototype._createApproversEvent = function(aApproversData, keys, date) {
		var event;
		var aApprovers;
		if (aApproversData && aApproversData.length > 0) {
			aApprovers = aApproversData.map(function(a) {
				return {
					FullName: a.FullName,
					Details: a
				};
			});

			event = {
				ActionTxt: this._oResourceBundle.getText(keys.action),
				Approvers: this._getApproversEventItems(
					aApprovers,
					this._oResourceBundle.getText(keys.message),
					8),
				Changed: date,
				Icon: keys.icon
			};
		}

		return event;
	};

	return BatchDetailPageExt;
});