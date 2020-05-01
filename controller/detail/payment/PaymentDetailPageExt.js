/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/base/Object", "sap/ui/model/json/JSONModel", "sap/ui/model/Context", "zfin/ap/zapprovebankpayments/model/formatter",
	"zfin/ap/zapprovebankpayments/model/Messaging", "zfin/ap/zapprovebankpayments/controller/detail/DraftController",
	"zfin/ap/zapprovebankpayments/controller/detail/DialogFactory"
], function (B, J, C, f, M, a, D) {
	var _ = new J({
		paymentAction: "",
		secondaryStatusView: "",
		PaymentActionFallback: "",
		batchEditable: false,
		isNewBatchEdit: false,
		useFallback: false,
		ignoreDocumentLink: false
	});
	var P = B.extend("zfin.ap.zapprovebankpayments.controller.detail.batch.BatchDetailPageExt", {
		constructor: function (c, v, e) {
			this.component = c;
			this.view = v;
			this.extensionAPI = e;
			this.messaging = M;
			this.formatter = f;
			this.dialogFactory = D;
			this.draftController = a;
		}
	});
	P.prototype.onInit = function () {
		this._oResourceBundle = this.component.getModel("@i18n").getResourceBundle();
		this.component.setModel(_, "paymentView");
		this.extensionAPI.attachPageDataLoaded(this.onPagePaymentDataLoaded.bind(this));
		this.messaging.subscribeEvent(this.messaging.eventName.PAYMENT_TABLE_CHANGE, this.busSubscriber, this);
		this._setupInvoiceTable();
		this.view.bindElement({
			path: "",
			parameters: {
				expand: "to_Payee,to_Batch"
			},
			events: {
				dataReceived: function (e) {
					var p = e.getParameter("data");
					this._onPaymentDataReady(p);
				}.bind(this)
			}
		});
	};
	P.prototype.busSubscriber = function (c, e, d) {
		var b = this.view.getBindingContext();
		this._onPaymentDataReady(b.getObject(), b, d.batch);
	};
	P.prototype.onPagePaymentDataLoaded = function (e) {
		var c = e.context;
		this._onPaymentDataReady(c.getObject(), c);
	};
	P.prototype._onPaymentDataReady = function (p, c, b) {
		var o = this.view.byId("objectPage");
		if (o) {
			o.getHeaderTitle().setObjectTitle(p.PaymentDocument);
		}
		this._setButtonsAvailability(p, c, b);
	};
	P.prototype._setButtonsAvailability = function (p, c, b) {
		var d = p.PaymentAction;
		var o = b;
		if (!o) {
			o = c ? c.getProperty("to_Batch") : p.to_Batch;
		}
		var i = o && (o.ApprovalIsFirst || o.IsReturnedApproval);
		_.setProperty("/batchEditable", this.isBatchEditable(o, new C(this.view.getModel(), this._getBatchKey(p))));
		_.setProperty("/isNewBatchEdit", i && !o.IsActiveEntity && !o.PaymentBatchIsProcessed);
		_.setProperty("/paymentAction", d);
		_.setProperty("/secondaryStatusView", i && !o.IsActiveEntity);
		_.setProperty("/useFallback", i && !o.IsActiveEntity && o.PaymentBatchIsProcessed);
		_.setProperty("/PaymentActionFallback", o ? o.PaymentBatchAction : undefined);
		_.setProperty("/ignoreDocumentLink", !p.BankPaymentGroupingOrigin.startsWith("FI"));
	};
	P.prototype.isBatchEditable = function (b, c) {
		var l = c.getProperty("DraftAdministrativeData/InProcessByUser");
		return b && b.IsActiveEntity && !l;
	};
	P.prototype.onEditPaymentInstructionKey = function () {
		this.dialogFactory.askEditInstructionKey(this.view, [this.view.getBindingContext()]).then(function (k) {
			this._updatePayment({
				DataExchangeInstruction: k
			});
		}.bind(this));
	};
	P.prototype.deferPayment = function () {
		this.dialogFactory.askDeferDate(this.view).then(function (d) {
			this._updatePayment({
				PaymentAction: "def",
				PaymentDeferDate: d
			});
		}.bind(this));
	};
	P.prototype.resetPayment = function () {
		this._updatePayment({
			PaymentAction: "",
			Status: "IBC01",
			PaymentDeferDate: null
		});
	};
	P.prototype.rejectPayment = function () {
		this._updatePayment({
			PaymentAction: "rej"
		});
	};
	P.prototype.onEditPayment = function () {
		var p = this.view.getBindingContext();
		var b = this._getBatch();
		var c = {
			batchContext: b
		};
		this.draftController.editableBatch(c, this.view, this.extensionAPI, p);
	};
	P.prototype._updatePayment = function (v) {
		var p = this.view.getBindingContext();
		var b = this._getBatch();
		this.draftController.update([p], b, v, this.extensionAPI).then(function (c) {
			this._onPaymentDataReady(p.getObject(), p, c);
			this.messaging.publishEvent(this.messaging.eventName.PAYMENT_CHANGE, {
				batch: c
			});
		}.bind(this));
	};
	P.prototype._getBatch = function () {
		var c = this.view.getBindingContext();
		var p = this.view.getModel().getObject(c.getPath(), {
			expand: "to_Batch"
		});
		return new C(this.view.getModel(), this._getBatchKey(p));
	};
	P.prototype._getBatchKey = function (p) {
		return "/" + this.view.getModel().createKey("C_AbpPaymentBatch", {
			PaymentBatch: p.to_Batch.PaymentBatch,
			DraftUUID: p.to_Batch.DraftUUID,
			IsActiveEntity: p.to_Batch.IsActiveEntity
		});
	};
	P.prototype._setupInvoiceTable = function () {
		var i = this.view.byId("to_Invoice::com.sap.vocabularies.UI.v1.LineItem::Table");
		if (i) {
			i.setUseVariantManagement(true);
		}
	};
	P.prototype.onExit = function (v) {
		this.extensionAPI.detachPageDataLoaded(this.onPagePaymentDataLoaded.bind(this));
		this.messaging.unsubscribeEvent(this.messaging.eventName.PAYMENT_TABLE_CHANGE, this.busSubscriber, this);
	};
	return P;
});