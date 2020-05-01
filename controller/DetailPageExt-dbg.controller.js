/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"zfin/ap/zapprovebankpayments/model/formatter",
	"zfin/ap/zapprovebankpayments/model/PopoverHandler",
	"zfin/ap/zapprovebankpayments/controller/detail/batch/BatchDetailPageExt",
	"zfin/ap/zapprovebankpayments/controller/detail/payment/PaymentDetailPageExt"
], function(
	formatter,
	PopoverHandler,
	BatchDetailPageExt,
	PaymentDetailPageExt) {
	"use strict";

	function _endsWith(text, suffix) {
		return text.substring(text.length - suffix.length) === suffix;
	}

	function _isOnBatch(id) {
		return _endsWith(id, "::C_AbpPaymentBatch");
	}

	function _isOnPayment(id) {
		return _endsWith(id, "::C_AbpPayment") || _endsWith(id, "::C_AprvBkPaytExcludedPayment");
	}

	function DetailPageExt() {}

	DetailPageExt.prototype.formatter = formatter;

	DetailPageExt.prototype.onInit = function(oEvent) {
		var component = this.getOwnerComponent();
		this._hideExtraActions();
		this._popoverHandler = new PopoverHandler(this.getView());

		var id = oEvent.getParameter("id");
		if (_isOnBatch(id)) {
			this.batchPageExt = new BatchDetailPageExt(component, this.getView(), this.extensionAPI);

			this.batchPageExt.onInit();
		} else if (_isOnPayment(id)) {
			this.paymentPageExt = new PaymentDetailPageExt(component, this.getView(), this.extensionAPI);
			this.paymentPageExt.onInit();
		}
	};

	DetailPageExt.prototype.onExit = function(oEvent) {
		this._popoverHandler.onExit();
		var id = oEvent.getParameter("id");
		if (_isOnBatch(id)) {
			this.batchPageExt.onExit();
		} else if (_isOnPayment(id)) {
			this.paymentPageExt.onExit();
		}
	};

	DetailPageExt.prototype.onApproveBatch = function() {
		this.batchPageExt.onProcessBatch("app");
	};

	DetailPageExt.prototype.onRejectBatch = function() {
		this.batchPageExt.onProcessBatch("rej");
	};

	DetailPageExt.prototype.onDeferBatch = function() {
		this.batchPageExt.onProcessBatch("def");
	};

	DetailPageExt.prototype.onReturnBatch = function() {
		this.batchPageExt.onProcessBatch("ret");
	};

	DetailPageExt.prototype.onUndoBatch = function() {
		this.batchPageExt.onUndoBatch();
	};

	DetailPageExt.prototype.onEditBatch = function() {
		this.batchPageExt.onEditBatch();
	};

	DetailPageExt.prototype.onEditPayment = function() {
		this.paymentPageExt.onEditPayment();
	};

	DetailPageExt.prototype.onEditPaymentInstructionKey = function() {
		this.paymentPageExt.onEditPaymentInstructionKey();
	};

	DetailPageExt.prototype.onResetPaymentStatus = function() {
		this.paymentPageExt.resetPayment();
	};

	DetailPageExt.prototype.onDeferPayment = function() {
		this.paymentPageExt.deferPayment();
	};

	DetailPageExt.prototype.onRejectPayment = function() {
		this.paymentPageExt.rejectPayment();
	};

	DetailPageExt.prototype.onBeforeDocumentPopoverOpens = function(oEvent) {
		this._popoverHandler.onBeforeDocumentPopoverOpens(oEvent);
	};

	DetailPageExt.prototype.onPayeeNavigationTargetsObtained = function(oEvent) {
		this._popoverHandler.onPayeeNavigationTargetsObtained(oEvent);
	};

	DetailPageExt.prototype.onBeforePayeePopoverOpens = function(oEvent) {
		this._popoverHandler.onBeforePayeePopoverOpens(oEvent);
	};

	DetailPageExt.prototype.onBeforePaymentPopoverOpens = function(oEvent) {
		this._popoverHandler.onBeforePaymentPopoverOpens(oEvent);
	};

	DetailPageExt.prototype.onPayeeBankNavigationTargetsObtained = function(oEvent) {
		this._popoverHandler.onPayeeBankNavigationTargetsObtained(oEvent);
	};

	DetailPageExt.prototype.onBeforePayeeBankPopoverOpens = function(oEvent) {
		this._popoverHandler.onBeforePayeeBankPopoverOpens(oEvent);
	};

	DetailPageExt.prototype._hideExtraActions = function() {
		var extraActions = ["delete", "edit", "template:::ObjectPageAction:::DisplayActiveVersion"];
		var header = this.byId("objectPageHeader");
		extraActions.forEach(function(id) {
			var extraAction = this.byId(id);
			if (header && extraAction) {
				extraAction.unbindProperty("enabled");
				extraAction.setEnabled(false);
				extraAction.unbindProperty("visible");
				extraAction.setVisible(false);
			}
		}.bind(this));
	};

	return sap.ui.controller(
		"zfin.ap.zapprovebankpayments.controller.DetailPageExt",
		new DetailPageExt());
}, true);