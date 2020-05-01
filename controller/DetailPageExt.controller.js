/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["zfin/ap/zapprovebankpayments/model/formatter", "zfin/ap/zapprovebankpayments/model/PopoverHandler",
	"zfin/ap/zapprovebankpayments/controller/detail/batch/BatchDetailPageExt",
	"zfin/ap/zapprovebankpayments/controller/detail/payment/PaymentDetailPageExt"
], function (f, P, B, a) {
	"use strict";

	function _(t, s) {
		return t.substring(t.length - s.length) === s;
	}

	function b(i) {
		return _(i, "::C_AbpPaymentBatch");
	}

	function c(i) {
		return _(i, "::C_AbpPayment") || _(i, "::C_AprvBkPaytExcludedPayment");
	}

	function D() {}
	D.prototype.formatter = f;
	D.prototype.onInit = function (e) {
		var d = this.getOwnerComponent();
		this._hideExtraActions();
		this._popoverHandler = new P(this.getView());
		var i = e.getParameter("id");
		if (b(i)) {
			this.batchPageExt = new B(d, this.getView(), this.extensionAPI);
			this.batchPageExt.onInit();
		} else if (c(i)) {
			this.paymentPageExt = new a(d, this.getView(), this.extensionAPI);
			this.paymentPageExt.onInit();
		}
	};
	D.prototype.onExit = function (e) {
		this._popoverHandler.onExit();
		var i = e.getParameter("id");
		if (b(i)) {
			this.batchPageExt.onExit();
		} else if (c(i)) {
			this.paymentPageExt.onExit();
		}
	};
	D.prototype.onApproveBatch = function () {
		this.batchPageExt.onProcessBatch("app");
	};
	D.prototype.onRejectBatch = function () {
		this.batchPageExt.onProcessBatch("rej");
	};
	D.prototype.onDeferBatch = function () {
		this.batchPageExt.onProcessBatch("def");
	};
	D.prototype.onReturnBatch = function () {
		this.batchPageExt.onProcessBatch("ret");
	};
	D.prototype.onUndoBatch = function () {
		this.batchPageExt.onUndoBatch();
	};
	D.prototype.onEditBatch = function () {
		this.batchPageExt.onEditBatch();
	};
	D.prototype.onEditPayment = function () {
		this.paymentPageExt.onEditPayment();
	};
	D.prototype.onEditPaymentInstructionKey = function () {
		this.paymentPageExt.onEditPaymentInstructionKey();
	};
	D.prototype.onResetPaymentStatus = function () {
		this.paymentPageExt.resetPayment();
	};
	D.prototype.onDeferPayment = function () {
		this.paymentPageExt.deferPayment();
	};
	D.prototype.onRejectPayment = function () {
		this.paymentPageExt.rejectPayment();
	};
	D.prototype.onBeforeDocumentPopoverOpens = function (e) {
		this._popoverHandler.onBeforeDocumentPopoverOpens(e);
	};
	D.prototype.onPayeeNavigationTargetsObtained = function (e) {
		this._popoverHandler.onPayeeNavigationTargetsObtained(e);
	};
	D.prototype.onBeforePayeePopoverOpens = function (e) {
		this._popoverHandler.onBeforePayeePopoverOpens(e);
	};
	D.prototype.onBeforePaymentPopoverOpens = function (e) {
		this._popoverHandler.onBeforePaymentPopoverOpens(e);
	};
	D.prototype.onPayeeBankNavigationTargetsObtained = function (e) {
		this._popoverHandler.onPayeeBankNavigationTargetsObtained(e);
	};
	D.prototype.onBeforePayeeBankPopoverOpens = function (e) {
		this._popoverHandler.onBeforePayeeBankPopoverOpens(e);
	};
	D.prototype._hideExtraActions = function () {
		var e = ["delete", "edit", "template:::ObjectPageAction:::DisplayActiveVersion"];
		var h = this.byId("objectPageHeader");
		e.forEach(function (i) {
			var d = this.byId(i);
			if (h && d) {
				d.unbindProperty("enabled");
				d.setEnabled(false);
				d.unbindProperty("visible");
				d.setVisible(false);
			}
		}.bind(this));
	};
	return sap.ui.controller("zfin.ap.zapprovebankpayments.controller.DetailPageExt", new D());
}, true);