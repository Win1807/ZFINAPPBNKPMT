/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
/*global Promise */
sap.ui.define([
	"sap/m/library",
	"sap/ui/core/InvisibleText",
	"zfin/ap/zapprovebankpayments/model/batchDraft",
	"zfin/ap/zapprovebankpayments/model/formatter",
	"zfin/ap/zapprovebankpayments/model/ListViewModel",
	"zfin/ap/zapprovebankpayments/model/Messaging",
	"zfin/ap/zapprovebankpayments/controller/ConfirmUndoDialog",
	"zfin/ap/zapprovebankpayments/controller/list/ConfirmMasterActionDialog",
	"zfin/ap/zapprovebankpayments/controller/list/ConfirmSubmitDialog",
	"zfin/ap/zapprovebankpayments/model/PopoverHandler"
	/* eslint-disable max-params */
], function(
	mobileLibrary,
	InvisibleText,
	BatchDraft,
	formatter,
	ListViewModel,
	Messaging,
	ConfirmUndoDialog,
	ConfirmMasterActionDialog,
	ConfirmSubmitDialog,
	PopoverHandler) {
	/* eslint-enable */
	"use strict";

	var ButtonType = mobileLibrary.ButtonType;

	var _constants = {
		tab1Suffix: "-_tab1_ForReview",
		tab2Suffix: "-_tab2_Reviewed",
		tableId: "responsiveTable",
		smartTableId: "listReport",
		iconTabBarId: "template::IconTabBar",
		toolbar: {
			approveId: "approveBatches",
			rejectId: "rejectBatches",
			deferId: "deferBatches",
			returnId: "returnBatches",
			undoId: "undoBatches",
			deleteId: "deleteEntry"
		}
	};

	var _messaging = Messaging;

	function _logError(sMessage, sDetails) {
		_messaging.logError(sMessage, sDetails, "zfin.ap.zapprovebankpayments.controller.list.ListReportExt");
	}

	function getMultiActionParams(contexts) {
		var actionItems = {};
		var i;
		for (i = 0; i < contexts.length; i++) {
			actionItems[contexts[i].getPath()] = Promise.resolve();
		}

		return {
			mConsiderObjectsAsDeleted: actionItems
		};
	}

	/**
	 * Alternative to oModel.createBindingContext(...) when data are not loaded
	 * 
	 * @param {any} model OData model
	 * @param {object} itemData batch key data
	 * 
	 * @returns {object} sap.ui.model.Context-like object
	 */
	function _createBindingContext(model, itemData) {
		return {
			getModel: function() {
				return this._model;
			},
			getObject: function() {
				return this._data;
			},
			getPath: function() {
				return this._path;
			},
			getProperty: function(prop) {
				return this._data[prop];
			},
			_data: itemData,
			_model: model,
			_path: "/" + model.createKey("C_AbpPaymentBatch", itemData)
		};
	}

	function _insertHiddenText(entry) {
		var siblingId = entry.sibling.getId();
		var idPrefix = siblingId.substring(0, siblingId.lastIndexOf("--") + 2);
		var parent = entry.sibling.getParent();
		var invisibleText = new InvisibleText(
			idPrefix + entry.id, {
				text: entry.text
			});

		parent.addContent(invisibleText);
	}

	function ListReportExt() {
		this.formatter = formatter;
		this._viewModel = ListViewModel;
		this._batchDraft = BatchDraft;
	}

	ListReportExt.prototype.onInit = function() {
		var component = this.getOwnerComponent();
		this._initSubComponents(component.getModel("@i18n").getResourceBundle());
		component.setModel(this._viewModel.getModel(), this._viewModel.getModelName());
		this._popoverHandler = new PopoverHandler(this.getView());

		this._initSmartFilterBar();
		this._adjustActions();
		this._initTables();
		this._provideHiddenTexts();

		_messaging.subscribeEvent(_messaging.eventName.BATCH_ACTION, this.onBatchEdited, this);
	};

	ListReportExt.prototype.onBatchEdited = function() {
		this.extensionAPI.refreshTable();
		this._fetchReviewedCount();
	};

	ListReportExt.prototype.onExit = function() {
		this._popoverHandler.onExit();
		_messaging.unsubscribeEvent(_messaging.eventName.BATCH_ACTION, this.onBatchEdited, this);
	};

	ListReportExt.prototype.onBeforeRebindTableExtension = function(oEvent) {
		var oBindingParams = oEvent.getParameter("bindingParams");
		this._viewModel.applyCustomFilters(oBindingParams);
		this._fetchReviewedCount();
	};

	ListReportExt.prototype.getCustomAppStateDataExtension = function(oCustomData) {
		this._viewModel.saveCustomState(oCustomData);
	};

	ListReportExt.prototype.restoreCustomAppStateDataExtension = function(oCustomData) {
		this._viewModel.restoreCustomState(oCustomData);
	};

	ListReportExt.prototype.onSelectionChanged = function(oEvent) {
		var table = oEvent.getSource();
		this._viewModel.onSelectionChanged(table.getSelectedItems());

		if (!this._deferDaysPeriod &&
			table.getItems().length > 0) {
			this.getOwnerComponent().getModel().read(
				table.getItems()[0].getBindingContext() + "/to_BankPaymentBatchRuleBaseCust", {
					success: function(oData) {
						var days = oData ? oData.ResubmissionDays : undefined;
						if (days && !isNaN(parseFloat(days)) && isFinite(days)) {
							this._deferDaysPeriod = days;
						}
					}.bind(this)
				});
		}
	};

	ListReportExt.prototype.onIconTabChange = function(oEvent) {
		var table = this.byId(_constants.tableId + "-" + oEvent.getParameter("key"));
		var binding = table.getBinding("items");

		if (binding) {
			binding.refresh();
		}
	};

	ListReportExt.prototype.onSubmitReviewed = function() {
		_messaging.actionStarted(this._getText("masterSubmitReviewed"));
		this.extensionAPI.securedExecution(
				this._getBatchProps.bind(this)
			).then(this._submitReviewed.bind(this))
			.catch(this._onActionFailure.bind(this));
	};

	ListReportExt.prototype.onMoreHouseBanksPress = function(oEvent) {
		this._popoverHandler.onMoreHouseBanksPress(oEvent);
	};

	ListReportExt.prototype.onMoreAccountsPress = function(oEvent) {
		this._popoverHandler.onMoreAccountsPress(oEvent);
	};

	ListReportExt.prototype.onBeforeHouseBankPopoverOpens = function(oEvent) {
		this._popoverHandler.onBeforeHouseBankPopoverOpens(oEvent);
	};

	ListReportExt.prototype.onAccountNavigationTargetsObtained = function(oEvent) {
		this._popoverHandler.onAccountNavigationTargetsObtained(oEvent);
	};

	ListReportExt.prototype.onHouseBankNavigationTargetsObtained = function(oEvent) {
		this._popoverHandler.onHouseBankNavigationTargetsObtained(oEvent);
	};

	ListReportExt.prototype.onHouseBankNavigationTargetsObtainedList = function(oEvent) {
		this._popoverHandler.onHouseBankNavigationTargetsObtainedList(oEvent);
	};

	ListReportExt.prototype.onBeforeAccountPopoverOpens = function(oEvent) {
		this._popoverHandler.onBeforeAccountPopoverOpens(oEvent);
	};

	ListReportExt.prototype.onApproveBatches = function() {
		this._multiSelectEdit("app");
	};

	ListReportExt.prototype.onRejectBatches = function() {
		this._multiSelectEdit("rej");
	};

	ListReportExt.prototype.onDeferBatches = function() {
		this._multiSelectEdit("def");
	};

	ListReportExt.prototype.onReturnBatches = function() {
		this._multiSelectEdit("ret");
	};

	ListReportExt.prototype.onUndoBatches = function() {
		this._confirmUndo().then(function(action) {
				_messaging.actionStarted(this._getText("masterSelectedBatchesUndo"));
				var items = this.extensionAPI.getSelectedContexts();
				var firstKey = items[0].getProperty("PaymentBatch");
				this.extensionAPI.securedExecution(this._batchDraft.undoBatches.bind(this, items, action))
					.then(this._onActionSuccess.bind(this, "undoBatchesChagesSuccess", items, "undoBatchChagesSuccess", firstKey),
					getMultiActionParams(items))
					.catch(this._onActionFailure.bind(this));
			}.bind(this))
			.catch(this._onActionFailure.bind(this));
	};

	ListReportExt.prototype._getBatchProps = function() {
		return new Promise(function(fnResolve, fnReject) {
			var oModel = this.getOwnerComponent().getModel();

			oModel.read("/C_AbpPaymentBatch/", {
				filters: this._viewModel.getReviewedTabFilters(),
				urlParameters: {
					"$select": "PaymentBatch,DraftUUID,IsActiveEntity,AuthenticationType"
				},
				success: fnResolve,
				error: fnReject
			});
		}.bind(this));
	};

	ListReportExt.prototype._initSubComponents = function(bundle) {
		this.formatter.setResourceBundle(bundle);
		this._viewModel.init(bundle);
		this._batchDraft.setResourceBundle(bundle);
		_messaging.setReourceBundle(bundle);
	};

	ListReportExt.prototype._initTables = function() {
		var tab1tab = this.byId(_constants.tableId + _constants.tab1Suffix);
		var tab2tab = this.byId(_constants.tableId + _constants.tab2Suffix);
		this.byId(_constants.iconTabBarId).attachSelect(this.onIconTabChange.bind(this));
		[_constants.tab1Suffix,
			_constants.tab2Suffix
		].forEach(function(tabId) {
			var smartTable = this.byId(_constants.smartTableId + tabId);
			smartTable.setRequestAtLeastFields(this._viewModel.getAllwaysRequestFields());
			smartTable.setIgnoredFields(this._viewModel.getIgnoredFields());
			smartTable.setUseExportToExcel(true);
		}.bind(this));

		tab1tab.attachSelectionChange(this.onSelectionChanged, this);
		tab1tab.attachUpdateFinished(this.onSelectionChanged, this);
		tab2tab.attachSelectionChange(this.onSelectionChanged, this);
		tab2tab.attachUpdateFinished(this.onSelectionChanged, this);
	};

	ListReportExt.prototype._onActionSuccess = function(messagePlural, aContexts, messageSingular, singleKey) {
		var message = aContexts.length > 1 ?
			this._getText(messagePlural, aContexts.length) :
			this._getText(messageSingular, singleKey);

		_messaging.actionFinished(message);
		this._refreshAfterAction();
	};

	ListReportExt.prototype._onActionFailure = function(error) {
		if (error) { // not just dialog -> cancel
			_messaging.addActionError(error);
			_messaging.actionFinished();
			this._refreshAfterAction();
		}
	};

	ListReportExt.prototype._adjustActions = function() {
		this._hideToolbarItem(_constants.toolbar.deleteId + _constants.tab1Suffix);
		[_constants.toolbar.deleteId,
			_constants.toolbar.approveId,
			_constants.toolbar.rejectId,
			_constants.toolbar.deferId,
			_constants.toolbar.returnId
		].forEach(function(id) {
			this._hideToolbarItem(id + _constants.tab2Suffix);
		}.bind(this));

		this._bindTab1Enabled(_constants.toolbar.rejectId, "firstStageActionsAvailable");
		this._bindTab1Enabled(_constants.toolbar.deferId, "firstStageActionsAvailable");
		this._bindTab1Enabled(_constants.toolbar.returnId, "nextStageActionsAvailable");
		this._bindTab1Enabled(_constants.toolbar.undoId, "undoAvailable");
		this._bindTabEnabled(_constants.tab2Suffix, _constants.toolbar.undoId, "undoAvailable");

		this._setupGlobalActions();
	};

	ListReportExt.prototype._submitReviewed = function(batchesData) {
		var authType = batchesData.results[0].AuthenticationType;
		var contexts = this._getContextsFromBatchesData(batchesData);
		new ConfirmSubmitDialog(this.getView(), authType)
			.then(function(authCode) {
				_messaging.actionStarted(this._getText("masterSubmitReviewed"));
				this.extensionAPI.securedExecution(
					this._submitReviewedByData.bind(this, contexts, authCode),
					getMultiActionParams(contexts)
				).catch(this._onActionFailure.bind(this));
			}.bind(this)).catch(this._onActionFailure.bind(this));
	};

	ListReportExt.prototype._setupGlobalActions = function(error) {
		var submitButton = this.byId("action::submitReviewed");
		submitButton.setType(ButtonType.Emphasized);
		submitButton.bindProperty("enabled", {
			path: "/submitReviewedAllowed",
			model: this._viewModel.getModelName()
		});

		submitButton.bindProperty("text", {
			path: "/submitReviewedText",
			model: this._viewModel.getModelName()
		});
	};

	ListReportExt.prototype._multiSelectEdit = function(sAction) {
		var aAllContexts = this.extensionAPI.getSelectedContexts();
		this._confirmAction(sAction, aAllContexts).then(function(oActionContext) {
				_messaging.actionStarted(this._getActionText(sAction));
				var takeOver = oActionContext.takeOver;
				var aContexts = this._getEditableContexts(aAllContexts, takeOver);
				var firstKey = aContexts[0].getProperty("PaymentBatch");
				this.extensionAPI.securedExecution(
						this._batchDraft.processBatches.bind(this, aContexts, oActionContext, takeOver),
						getMultiActionParams(aContexts))
					.then(this._onActionSuccess.bind(this, "editBatchesSuccess", aContexts, "editBatchSuccess", firstKey))
					.catch(this._onActionFailure.bind(this));
			}.bind(this))
			.catch(this._onActionFailure.bind(this));
	};

	ListReportExt.prototype._getActionText = function(sAction) {
		var actionToText = {
			"app": "masterSelectedBatchesApprove",
			"def": "masterSelectedBatchesDefer",
			"rej": "masterSelectedBatchesReject",
			"ret": "masterSelectedBatchesReturn"
		};

		return this._getText(actionToText[sAction]);
	};

	ListReportExt.prototype._refreshAfterAction = function() {
		this.extensionAPI.refreshTable();
		this._fetchReviewedCount();
	};

	ListReportExt.prototype._fetchReviewedCount = function() {
		var oModel = this.getOwnerComponent().getModel();
		oModel.read("/C_AbpPaymentBatch/$count", {
			filters: this._viewModel.getReviewedTabFilters(),
			success: function(data) {
				this._viewModel.setReviewedCount(data);
			}.bind(this),
			error: function(oError) {
				this._viewModel.setReviewedCount("0");
				_logError("Failed to load reviewed batches.", oError);
			}.bind(this)
		});
	};

	ListReportExt.prototype._getContextsFromBatchesData = function(oData) {
		var oModel = this.getOwnerComponent().getModel();
		return oData.results.map(function(item) {
			var itemData = {
				PaymentBatch: item.PaymentBatch,
				DraftUUID: item.DraftUUID,
				IsActiveEntity: item.IsActiveEntity
			};

			return _createBindingContext(oModel, itemData);
		});
	};

	ListReportExt.prototype._submitReviewedByData = function(contexts, authCode) {
		var firstKey = contexts[0].getProperty("PaymentBatch");

		this._batchDraft.submitReviewed(contexts, authCode)
			.then(
				this._onActionSuccess.bind(this, "submitBatchesSuccess", contexts, "submitBatchSuccess", firstKey)
			).catch(this._onActionFailure.bind(this));
	};

	ListReportExt.prototype._getEditableContexts = function(aAllContexts, bTakeOver) {
		return aAllContexts.filter(function(batchContext) {
			return !batchContext.getProperty("IsActiveEntity") ||
				!batchContext.getProperty("HasDraftEntity") ||
				bTakeOver && !batchContext.getProperty("DraftAdministrativeData/InProcessByUser");
		});
	};

	ListReportExt.prototype._confirmAction = function(sAction, aBindings) {
		var deferDate = new Date();
		if (this._deferDaysPeriod) {
			deferDate.setDate(deferDate.getDate() + this._deferDaysPeriod);
		}

		return new ConfirmMasterActionDialog(this.getView(), {
			action: sAction,
			isDefer: sAction === "def",
			isReject: sAction === "rej",
			deferDate: deferDate,
			deferMinDate: new Date(),
			note: ""
		}, aBindings);
	};

	ListReportExt.prototype._confirmUndo = function() {
		var context = this.extensionAPI.getSelectedContexts();
		return new ConfirmUndoDialog(this.getView(), context);
	};

	ListReportExt.prototype._getText = function() {
		var i18n = this.getOwnerComponent().getModel("@i18n").getResourceBundle();
		return i18n.getText.apply(i18n, arguments);
	};

	ListReportExt.prototype._bindTab1Enabled = function(id, propertyName) {
		this._bindTabEnabled(_constants.tab1Suffix, id, propertyName);
	};

	ListReportExt.prototype._bindTabEnabled = function(tabSuffix, id, propertyName) {
		var element = this.byId(id + tabSuffix);
		element.bindProperty("enabled", {
			path: "/" + propertyName,
			model: this._viewModel.getModelName()
		});
	};

	ListReportExt.prototype._hideToolbarItem = function(id) {
		var item = this.byId(id);
		if (item) {
			item.setVisible(false);
		}
	};

	ListReportExt.prototype._initSmartFilterBar = function() {
		var oSmartFilterBar = this.byId("listReportFilter");
		if (oSmartFilterBar) {
			oSmartFilterBar.setUseDateRangeType(true);
		}
	};

	ListReportExt.prototype._provideHiddenTexts = function() {
		var sibling = this.byId("listReportFilter");
		var entries = [{
			id: "houseBankColumnHeaderText",
			sibling: sibling,
			text: "{/#C_AbpPaymentBatchType/HouseBank/@sap:label}"
		}, {
			id: "houseBankAccountColumnHeaderText",
			sibling: sibling,
			text: "{/#C_AbpPaymentBatchType/HouseBankAccount/@sap:label}"
		}];

		if (sibling) {
			entries.forEach(_insertHiddenText);
		}
	};

	return sap.ui.controller(
		"zfin.ap.zapprovebankpayments.controller.list.ListReportExt",
		new ListReportExt());
}, true);