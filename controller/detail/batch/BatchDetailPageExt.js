/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/base/Object", "sap/ui/model/json/JSONModel", "sap/m/Button", "zfin/ap/zapprovebankpayments/model/formatter",
	"zfin/ap/zapprovebankpayments/model/Messaging", "zfin/ap/zapprovebankpayments/model/PaymentListModel",
	"zfin/ap/zapprovebankpayments/controller/detail/DraftController", "zfin/ap/zapprovebankpayments/controller/detail/DialogFactory"
], function (B, J, b, f, M, P, c, D) {
	"use strict";
	var p = P;
	var _ = new J({
		timeline: [],
		approveActionAvailable: false,
		firstStageActionsAvailable: false,
		nextStageActionsAvailable: false,
		draftStageActionsAvailable: false,
		canManagePayments: false,
		isEditable: false,
		attachmentSelected: false,
		paymentsActionAvailable: false,
		paymentTableSelectable: false,
		zfirstStageActionsAvailable1: false //+@WVF001
	});
	var d = {
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

	function e(o, a, i) {
		var j = o[i];
		var s = a && j ? a.getProperty(i) : undefined;
		if (s) {
			j = s.map(function (k) {
				return a.getModel().getObject("/" + k);
			});
		}
		return j;
	}

	function g(I) {
		var i;
		var s = ",";
		for (i = 0; i + 1 < I.length; i++) {
			I[i].Suffix = s;
		}
		return I;
	}
	var h = B.extend("zfin.ap.zapprovebankpayments.controller.detail.batch.BatchDetailPageExt", {
		constructor: function (a, v, i) {
			this.component = a;
			this.view = v;
			this.extensionAPI = i;
			this.formatter = f;
			this.draftController = c;
			this.dialogFactory = D;
			this.messaging = M;
		}
	});
	h.prototype.onInit = function () {
		this.table = this.view.byId("Payments::responsiveTable");
		this.paymentsTable = this.view.byId("Payments::Table");
		this._setupBatchPage();
		this.component.setModel(_, "batchView");
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
	h.prototype._setupExtraBinding = function () {
		var a = this.view.byId("ExcludedPayments::Section");
		var v = "visible";
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
				dataReceived: function (i) {
					var j = i.getParameter("data");
					this._onBatchDataReady(j);
				}.bind(this)
			}
		});
		if (a) {
			a.bindProperty(v, {
				path: "IsReturnedApproval",
				formatter: function (i) {
					return !!i;
				}
			});
		}
	};
	h.prototype._addActionButton = function () {
		var t = this.paymentsTable.getToolbar();
		var a = function (j) {
			t.addContent(this._createButton(this._oResourceBundle.getText(j.text), j.action.bind(this)));
		};
		var i = [{
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
		i.forEach(a.bind(this));
	};
	h.prototype._createButton = function (t, a) {
		return new b({
			text: t,
			press: a.bind(this),
			enabled: "{= ${batchView>/isEditable} && ${batchView>/paymentsActionAvailable}}",
			visible: "{batchView>/firstStageActionsAvailable}"
		});
	};
	h.prototype._bindActionButtons = function () {
		["action::rejectBatch", "action::deferBatch"].forEach(function (a) {
			var i = this.view.byId(a);

			//INIT REPLACE @WVF001			
			// if (i) {
			// 	i.bindProperty("enabled", {
			// 		path: "batchView>/canManagePayments"
			// 	});
			// }

			if (i) {
				if (a === "action::rejectBatch") {
					i.bindProperty("visible", {
						path: "batchView>/zfirstStageActionsAvailable"
					});
					i.bindProperty("enabled", {
						path: "batchView>/zfirstStageActionsAvailable"
					});
				} else {
					i.bindProperty("enabled", {
						path: "batchView>/canManagePayments"
					});
				}

			}
			//END REPLACE @WVF001

		}.bind(this));
	};
	h.prototype.onExit = function () {
		this.extensionAPI.detachPageDataLoaded(this.onBatchDataLoaded.bind(this));
		this.messaging.unsubscribeEvent(this.messaging.eventName.PAYMENT_CHANGE, this.busSubscriber, this);
	};
	h.prototype.onBatchDataLoaded = function (E) {
		var a = E.context;
		this._onBatchDataReady(a.getObject(), a);
	};
	h.prototype.onProcessBatch = function (a) {
		var i = {
			batchContext: this._getCurrentContext(),
			action: a,
			items: this.table.getItems()
		};
		this.draftController.processBatch(i, this.view, this.extensionAPI);
	};
	h.prototype.onUndoBatch = function () {
		this.draftController.undoBatchWithMessages(this._getCurrentContext(), this.view, this.extensionAPI);
	};
	h.prototype.onPaymentsTableSelectionChange = function () {
		_.setProperty("/paymentsActionAvailable", this.table.getSelectedItems().length > 0);
	};
	h.prototype.onEditBatch = function () {
		var a = {
			batchContext: this._getCurrentContext()
		};
		this.draftController.editableBatch(a, this.view, this.extensionAPI);
	};
	h.prototype.busSubscriber = function (a, i, j) {
		this._computeViewModel(j.batch, this._getCurrentContext());
	};
	h.prototype.onEditInstructionKey = function () {
		var C = this._getSelectedItemsContext();
		this.dialogFactory.askEditInstructionKey(this.view, C).then(function (k) {
			this._updateSelectedPayments({
				DataExchangeInstruction: k
			});
		}.bind(this));
	};
	h.prototype._getSelectedItemsContext = function () {
		var i = function (I) {
			return I.getBindingContext();
		};
		return this.table.getSelectedItems().map(i);
	};
	h.prototype._getSelectedItemsKeys = function () {
		var i = function (I) {
			return I.getBindingContext().getProperty("PaymentBatchItem");
		};
		return this.table.getSelectedItems().map(i);
	};
	h.prototype.onRejectPress = function () {
		this._updateSelectedPayments({
			PaymentAction: "rej"
		});
	};
	h.prototype.onResetStatusPress = function () {
		this._updateSelectedPayments({
			PaymentAction: "",
			Status: "IBC01",
			PaymentDeferDate: null
		});
	};
	h.prototype._updateSelectedPayments = function (v) {
		var C = this._getSelectedItemsContext();
		this.draftController.update(C, this._getCurrentContext(), v, this.extensionAPI).then(function (a) {
			var s = this._getStageinfo(a, this._getCurrentContext());
			_.setProperty("/canManagePayments", s.isFirstStage && s.isUnlocked && !s.oBatch.PaymentBatchIsEdited);
			this.messaging.publishEvent(this.messaging.eventName.PAYMENT_TABLE_CHANGE, {
				batch: a
			});
		}.bind(this));
	};
	h.prototype.onDeferPress = function () {
		this.dialogFactory.askDeferDate(this.view).then(function (a) {
			this._updateSelectedPayments({
				PaymentAction: "def",
				PaymentDeferDate: a
			});
		}.bind(this));
	};
	h.prototype._getCurrentContext = function () {
		return this.view.getBindingContext();
	};
	h.prototype._onBatchDataReady = function (a, i) {
		this._computeViewModel(a, i);
		if (i) {
			this.dialogFactory.checkDeferDaysPeriod(i);
		}
	};
	h.prototype._computeViewModel = function (a, i) {
		var j = this._getAttachments(a, i);
		var s = this._getStageinfo(a, i);
		_.setProperty("/attachments", j);
		_.setProperty("/isEditable", !a.IsActiveEntity && !a.PaymentBatchIsProcessed);
		_.setProperty("/paymentTableSelectable", !a.IsActiveEntity && !a.PaymentBatchIsProcessed && s.isNew);
		_.setProperty("/batchEditable", a.IsActiveEntity && s.isUnlocked);
		_.setProperty("/paymentsActionAvailable", this.table.getSelectedItems().length > 0);
		_.setProperty("/approveActionAvailable", s.isFirstStage || s.isNextStage);
		_.setProperty("/firstStageActionsAvailable", s.isFirstStage);
		_.setProperty("/nextStageActionsAvailable", s.isNextStage);
		_.setProperty("/draftStageActionsAvailable", s.isReviewedStage);
		_.setProperty("/canManagePayments", s.isFirstStage && s.isUnlocked && !s.oBatch.PaymentBatchIsEdited);
		_.setProperty("/timeline", this._getEvents(a, i));
		if (a.Status === "IBC01" || a.Status === "IBC02") {
			_.setProperty("/zfirstStageActionsAvailable1", true);
		} else {
			_.setProperty("/zfirstStageActionsAvailable1", false);
		}
	};
	h.prototype._getStageinfo = function (a, i) {
		var j = a && a.ApprovalIsFirst || a.IsReturnedApproval;
		var k = a && !a.PaymentBatchIsProcessed;
		return {
			isNew: j,
			isNotProcessed: k,
			isFirstStage: k && j,
			isNextStage: k && !j,
			isReviewedStage: a && !a.IsActiveEntity,
			isUnlocked: a && (!a.IsActiveEntity || !a.HasDraftEntity || !this._getLockUser(a, i)),
			oBatch: a
		};
	};
	h.prototype._getLockUser = function (a, i) {
		var l;
		if (i) {
			l = i.getProperty("DraftAdministrativeData/InProcessByUser");
		} else {
			l = a.DraftAdministrativeData ? a.DraftAdministrativeData.InProcessByUser : undefined;
		}
		return l;
	};
	h.prototype._setupBatchPage = function () {
		var o = this.view.byId("objectPage");
		if (o) {
			var a = o.getHeaderTitle();
			a.bindProperty("objectTitle", {
				parts: [{
					path: "PaymentBatch"
				}],
				formatter: this.formatter.paymentBatchTitle
			});
			a.unbindProperty("objectSubtitle");
		}
		this._setupPaymentsTable(this.paymentsTable, p.standardSettings);
		this._setupPaymentsTable(this.view.byId("ExcludedPayments::Table"), p.excludeSettings);
	};
	h.prototype._setupPaymentsTable = function (t, s) {
		if (t) {
			t.setRequestAtLeastFields(s.requestAtLeast);
			t.setIgnoredFields(s.ignored);
			t.setUseExportToExcel(true);
			t.setUseVariantManagement(true);
		}
	};
	h.prototype._getAttachments = function (i, j) {
		var k = e(i, j, "GetAttachment");
		var l = [];
		if (k && k.length) {
			l = k.map(function (a) {
				a.DownloadUrl = "/sap/opu/odata/sap/FAP_APPROVEBANKPAYMENTS_SRV/AttachmentDownloadSet(ID='" + a.AttachmId + "')/$value";
				return a;
			});
		}
		return l;
	};
	h.prototype._getEvents = function (a, i) {
		var j = e(a, i, "GetHistory");
		var k = e(a, i, "GetApproverList");
		var l = e(a, i, "GetFutureApproverList");
		var m = [];
		if (j) {
			m = this._getFutureEvents(l, k).concat(j);
		}
		return m;
	};
	h.prototype._getFutureEvents = function (a, i) {
		var n = new Date();
		var j = new Date(n.getTime() + 1000);
		var k = [this._createApproversEvent(a, d.future, j), this._createApproversEvent(i, d.current, n)];
		return k.filter(function (l) {
			return l;
		});
	};
	h.prototype._getApproversEventItems = function (a, s, t) {
		var i = a.slice(0, t);
		if (a.length > t) {
			i.push({
				FullName: this._oResourceBundle.getText("batchTimelineRemainigApprovers", [a.length - t]),
				Approvers: a.slice(t)
			});
		}
		i = g(i);
		if (s) {
			i.unshift({
				Prefix: s
			});
		}
		return i;
	};
	h.prototype._createApproversEvent = function (A, k, i) {
		var j;
		var l;
		if (A && A.length > 0) {
			l = A.map(function (a) {
				return {
					FullName: a.FullName,
					Details: a
				};
			});
			j = {
				ActionTxt: this._oResourceBundle.getText(k.action),
				Approvers: this._getApproversEventItems(l, this._oResourceBundle.getText(k.message), 8),
				Changed: i,
				Icon: k.icon
			};
		}
		return j;
	};
	return h;
});