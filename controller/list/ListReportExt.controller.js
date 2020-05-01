/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/m/library", "sap/ui/core/InvisibleText", "zfin/ap/zapprovebankpayments/model/batchDraft",
	"zfin/ap/zapprovebankpayments/model/formatter", "zfin/ap/zapprovebankpayments/model/ListViewModel",
	"zfin/ap/zapprovebankpayments/model/Messaging", "zfin/ap/zapprovebankpayments/controller/ConfirmUndoDialog",
	"zfin/ap/zapprovebankpayments/controller/list/ConfirmMasterActionDialog",
	"zfin/ap/zapprovebankpayments/controller/list/ConfirmSubmitDialog", "zfin/ap/zapprovebankpayments/model/PopoverHandler"
], function (m, I, B, f, L, M, C, a, b, P) {
	"use strict";
	var c = m.ButtonType;
	var _ = {
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
	var d = M;

	function e(s, D) {
		d.logError(s, D, "zfin.ap.zapprovebankpayments.controller.list.ListReportExt");
	}

	function g(l) {
		var n = {};
		var i;
		for (i = 0; i < l.length; i++) {
			n[l[i].getPath()] = Promise.resolve();
		}
		return {
			mConsiderObjectsAsDeleted: n
		};
	}

	function h(i, l) {
		return {
			getModel: function () {
				return this._model;
			},
			getObject: function () {
				return this._data;
			},
			getPath: function () {
				return this._path;
			},
			getProperty: function (p) {
				return this._data[p];
			},
			_data: l,
			_model: i,
			_path: "/" + i.createKey("C_AbpPaymentBatch", l)
		};
	}

	function j(i) {
		var s = i.sibling.getId();
		var l = s.substring(0, s.lastIndexOf("--") + 2);
		var p = i.sibling.getParent();
		var n = new I(l + i.id, {
			text: i.text
		});
		p.addContent(n);
	}

	function k() {
		this.formatter = f;
		this._viewModel = L;
		this._batchDraft = B;
	}
	k.prototype.onInit = function () {
		var i = this.getOwnerComponent();
		this._initSubComponents(i.getModel("@i18n").getResourceBundle());
		i.setModel(this._viewModel.getModel(), this._viewModel.getModelName());
		this._popoverHandler = new P(this.getView());
		this._initSmartFilterBar();
		this._adjustActions();
		this._initTables();
		this._provideHiddenTexts();
		d.subscribeEvent(d.eventName.BATCH_ACTION, this.onBatchEdited, this);
	};
	k.prototype.onBatchEdited = function () {
		this.extensionAPI.refreshTable();
		this._fetchReviewedCount();
	};
	k.prototype.onExit = function () {
		this._popoverHandler.onExit();
		d.unsubscribeEvent(d.eventName.BATCH_ACTION, this.onBatchEdited, this);
	};
	k.prototype.onBeforeRebindTableExtension = function (E) {
		var o = E.getParameter("bindingParams");
		this._viewModel.applyCustomFilters(o);
		this._fetchReviewedCount();
	};
	k.prototype.getCustomAppStateDataExtension = function (o) {
		this._viewModel.saveCustomState(o);
	};
	k.prototype.restoreCustomAppStateDataExtension = function (o) {
		this._viewModel.restoreCustomState(o);
	};
	k.prototype.onSelectionChanged = function (E) {
		
		var t = E.getSource();
		this._viewModel.onSelectionChanged(t.getSelectedItems());
		if (!this._deferDaysPeriod && t.getItems().length > 0) {
			this.getOwnerComponent().getModel().read(t.getItems()[0].getBindingContext() + "/to_BankPaymentBatchRuleBaseCust", {
				success: function (D) {
					var i = D ? D.ResubmissionDays : undefined;
					if (i && !isNaN(parseFloat(i)) && isFinite(i)) {
						this._deferDaysPeriod = i;
					}
				}.bind(this)
			});
		}
		
			
	};
	k.prototype.onIconTabChange = function (E) {
		var t = this.byId(_.tableId + "-" + E.getParameter("key"));
		var i = t.getBinding("items");
		if (i) {
			i.refresh();
		}
	};
	k.prototype.onSubmitReviewed = function () {
		d.actionStarted(this._getText("masterSubmitReviewed"));
		this.extensionAPI.securedExecution(this._getBatchProps.bind(this)).then(this._submitReviewed.bind(this)).catch(this._onActionFailure.bind(
			this));
	};
	k.prototype.onMoreHouseBanksPress = function (E) {
		this._popoverHandler.onMoreHouseBanksPress(E);
	};
	k.prototype.onMoreAccountsPress = function (E) {
		this._popoverHandler.onMoreAccountsPress(E);
	};
	k.prototype.onBeforeHouseBankPopoverOpens = function (E) {
		this._popoverHandler.onBeforeHouseBankPopoverOpens(E);
	};
	k.prototype.onAccountNavigationTargetsObtained = function (E) {
		this._popoverHandler.onAccountNavigationTargetsObtained(E);
	};
	k.prototype.onHouseBankNavigationTargetsObtained = function (E) {
		this._popoverHandler.onHouseBankNavigationTargetsObtained(E);
	};
	k.prototype.onHouseBankNavigationTargetsObtainedList = function (E) {
		this._popoverHandler.onHouseBankNavigationTargetsObtainedList(E);
	};
	k.prototype.onBeforeAccountPopoverOpens = function (E) {
		this._popoverHandler.onBeforeAccountPopoverOpens(E);
	};
	k.prototype.onApproveBatches = function () {
		this._multiSelectEdit("app");
	};
	k.prototype.onRejectBatches = function () {
		this._multiSelectEdit("rej");
	};
	k.prototype.onDeferBatches = function () {
		this._multiSelectEdit("def");
	};
	k.prototype.onReturnBatches = function () {
		this._multiSelectEdit("ret");
	};
	k.prototype.onUndoBatches = function () {
		this._confirmUndo().then(function (i) {
			d.actionStarted(this._getText("masterSelectedBatchesUndo"));
			var l = this.extensionAPI.getSelectedContexts();
			var n = l[0].getProperty("PaymentBatch");
			this.extensionAPI.securedExecution(this._batchDraft.undoBatches.bind(this, l, i)).then(this._onActionSuccess.bind(this,
				"undoBatchesChagesSuccess", l, "undoBatchChagesSuccess", n), g(l)).catch(this._onActionFailure.bind(this));
		}.bind(this)).catch(this._onActionFailure.bind(this));
	};
	k.prototype._getBatchProps = function () {
		return new Promise(function (r, R) {
			var o = this.getOwnerComponent().getModel();
			o.read("/C_AbpPaymentBatch/", {
				filters: this._viewModel.getReviewedTabFilters(),
				urlParameters: {
					"$select": "PaymentBatch,DraftUUID,IsActiveEntity,AuthenticationType"
				},
				success: r,
				error: R
			});
		}.bind(this));
	};
	k.prototype._initSubComponents = function (i) {
		this.formatter.setResourceBundle(i);
		this._viewModel.init(i);
		this._batchDraft.setResourceBundle(i);
		d.setReourceBundle(i);
	};
	k.prototype._initTables = function () {
		var t = this.byId(_.tableId + _.tab1Suffix);
		var i = this.byId(_.tableId + _.tab2Suffix);
		this.byId(_.iconTabBarId).attachSelect(this.onIconTabChange.bind(this));
		[_.tab1Suffix, _.tab2Suffix].forEach(function (l) {
			var s = this.byId(_.smartTableId + l);
			s.setRequestAtLeastFields(this._viewModel.getAllwaysRequestFields());
			s.setIgnoredFields(this._viewModel.getIgnoredFields());
			s.setUseExportToExcel(true);
		}.bind(this));
		t.attachSelectionChange(this.onSelectionChanged, this);
		t.attachUpdateFinished(this.onSelectionChanged, this);
		i.attachSelectionChange(this.onSelectionChanged, this);
		i.attachUpdateFinished(this.onSelectionChanged, this);
	};
	k.prototype._onActionSuccess = function (i, l, n, s) {
		var o = l.length > 1 ? this._getText(i, l.length) : this._getText(n, s);
		d.actionFinished(o);
		this._refreshAfterAction();
	};
	k.prototype._onActionFailure = function (i) {
		if (i) {
			d.addActionError(i);
			d.actionFinished();
			this._refreshAfterAction();
		}
	};
	k.prototype._adjustActions = function () {
		this._hideToolbarItem(_.toolbar.deleteId + _.tab1Suffix);
		[_.toolbar.deleteId, _.toolbar.approveId, _.toolbar.rejectId, _.toolbar.deferId, _.toolbar.returnId].forEach(function (i) {
			this._hideToolbarItem(i + _.tab2Suffix);
		}.bind(this));
		this._bindTab1Enabled(_.toolbar.rejectId, "zfirstStageActionsAvailable");//+@WVF001
		// this._bindTab1Enabled(_.toolbar.rejectId, "firstStageActionsAvailable");//-@WVF001
		this._bindTab1Enabled(_.toolbar.deferId, "firstStageActionsAvailable");
		this._bindTab1Enabled(_.toolbar.returnId, "nextStageActionsAvailable");
		this._bindTab1Enabled(_.toolbar.undoId, "undoAvailable");
		this._bindTabEnabled(_.tab2Suffix, _.toolbar.undoId, "undoAvailable");
		this._setupGlobalActions();
	};
	k.prototype._submitReviewed = function (i) {
		var l = i.results[0].AuthenticationType;
		var n = this._getContextsFromBatchesData(i);
		new b(this.getView(), l).then(function (o) {
			d.actionStarted(this._getText("masterSubmitReviewed"));
			this.extensionAPI.securedExecution(this._submitReviewedByData.bind(this, n, o), g(n)).catch(this._onActionFailure.bind(this));
		}.bind(this)).catch(this._onActionFailure.bind(this));
	};
	k.prototype._setupGlobalActions = function (i) {
		var s = this.byId("action::submitReviewed");
		s.setType(c.Emphasized);
		s.bindProperty("enabled", {
			path: "/submitReviewedAllowed",
			model: this._viewModel.getModelName()
		});
		s.bindProperty("text", {
			path: "/submitReviewedText",
			model: this._viewModel.getModelName()
		});
	};
	k.prototype._multiSelectEdit = function (A) {
		var i = this.extensionAPI.getSelectedContexts();
		this._confirmAction(A, i).then(function (o) {
			d.actionStarted(this._getActionText(A));
			var t = o.takeOver;
			var l = this._getEditableContexts(i, t);
			var n = l[0].getProperty("PaymentBatch");
			this.extensionAPI.securedExecution(this._batchDraft.processBatches.bind(this, l, o, t), g(l)).then(this._onActionSuccess.bind(this,
				"editBatchesSuccess", l, "editBatchSuccess", n)).catch(this._onActionFailure.bind(this));
		}.bind(this)).catch(this._onActionFailure.bind(this));
	};
	k.prototype._getActionText = function (A) {
		var i = {
			"app": "masterSelectedBatchesApprove",
			"def": "masterSelectedBatchesDefer",
			"rej": "masterSelectedBatchesReject",
			"ret": "masterSelectedBatchesReturn"
		};
		return this._getText(i[A]);
	};
	k.prototype._refreshAfterAction = function () {
		this.extensionAPI.refreshTable();
		this._fetchReviewedCount();
	};
	k.prototype._fetchReviewedCount = function () {
		var o = this.getOwnerComponent().getModel();
		o.read("/C_AbpPaymentBatch/$count", {
			filters: this._viewModel.getReviewedTabFilters(),
			success: function (i) {
				this._viewModel.setReviewedCount(i);
			}.bind(this),
			error: function (E) {
				this._viewModel.setReviewedCount("0");
				e("Failed to load reviewed batches.", E);
			}.bind(this)
		});
	};
	k.prototype._getContextsFromBatchesData = function (D) {
		var o = this.getOwnerComponent().getModel();
		return D.results.map(function (i) {
			var l = {
				PaymentBatch: i.PaymentBatch,
				DraftUUID: i.DraftUUID,
				IsActiveEntity: i.IsActiveEntity
			};
			return h(o, l);
		});
	};
	k.prototype._submitReviewedByData = function (i, l) {
		var n = i[0].getProperty("PaymentBatch");
		this._batchDraft.submitReviewed(i, l).then(this._onActionSuccess.bind(this, "submitBatchesSuccess", i, "submitBatchSuccess", n)).catch(
			this._onActionFailure.bind(this));
	};
	k.prototype._getEditableContexts = function (A, t) {
		return A.filter(function (i) {
			return !i.getProperty("IsActiveEntity") || !i.getProperty("HasDraftEntity") || t && !i.getProperty(
				"DraftAdministrativeData/InProcessByUser");
		});
	};
	k.prototype._confirmAction = function (A, i) {
		var l = new Date();
		if (this._deferDaysPeriod) {
			l.setDate(l.getDate() + this._deferDaysPeriod);
		}
		return new a(this.getView(), {
			action: A,
			isDefer: A === "def",
			isReject: A === "rej",
			deferDate: l,
			deferMinDate: new Date(),
			note: ""
		}, i);
	};
	k.prototype._confirmUndo = function () {
		var i = this.extensionAPI.getSelectedContexts();
		return new C(this.getView(), i);
	};
	k.prototype._getText = function () {
		var i = this.getOwnerComponent().getModel("@i18n").getResourceBundle();
		return i.getText.apply(i, arguments);
	};
	k.prototype._bindTab1Enabled = function (i, p) {
		this._bindTabEnabled(_.tab1Suffix, i, p);
	};
	k.prototype._bindTabEnabled = function (t, i, p) {
		var l = this.byId(i + t);
		l.bindProperty("enabled", {
			path: "/" + p,
			model: this._viewModel.getModelName()
		});
	};
	k.prototype._hideToolbarItem = function (i) {
		var l = this.byId(i);
		if (l) {
			l.setVisible(false);
		}
	};
	k.prototype._initSmartFilterBar = function () {
		var s = this.byId("listReportFilter");
		if (s) {
			s.setUseDateRangeType(true);
		}
	};
	k.prototype._provideHiddenTexts = function () {
		var s = this.byId("listReportFilter");
		var i = [{
			id: "houseBankColumnHeaderText",
			sibling: s,
			text: "{/#C_AbpPaymentBatchType/HouseBank/@sap:label}"
		}, {
			id: "houseBankAccountColumnHeaderText",
			sibling: s,
			text: "{/#C_AbpPaymentBatchType/HouseBankAccount/@sap:label}"
		}];
		if (s) {
			i.forEach(j);
		}
	};
	return sap.ui.controller("zfin.ap.zapprovebankpayments.controller.list.ListReportExt", new k());
}, true);