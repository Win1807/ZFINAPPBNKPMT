/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/Global", "sap/ui/model/Context", "sap/ui/core/mvc/Controller", "zfin/ap/zapprovebankpayments/model/formatter",
	"zfin/ap/zapprovebankpayments/controller/detail/DraftController", "zfin/ap/zapprovebankpayments/controller/detail/DialogFactory",
	"zfin/ap/zapprovebankpayments/model/PopoverHandler"
], function (G, C, B, f, D, a, P) {
	"use strict";
	var _ = "zfin.ap.zapprovebankpayments.controller.detail.payment.PaymentInfo";
	var b = B.extend(_, {
		_draftController: D,
		_eventBus: sap.ui.getCore().getEventBus(),
		_dialogFactory: a,
		formatter: f,
		constructor: function () {}
	});
	b.prototype.onInit = function () {
		this._popoverHandler = new P(this.getView());
	};
	b.prototype.onExit = function () {
		this._popoverHandler.onExit();
	};
	b.prototype.paymentActionToStatus = function (s, p, u) {
		var v = this.getOwnerComponent().getModel("paymentView");
		var A = v.getProperty("/secondaryStatusView");
		var c = v.getProperty("/PaymentActionFallback");
		var d = u && !p ? c : p;
		return this.formatter.paymentActionToStatus(s, A, d);
	};
	b.prototype._getContext = function () {
		return this.getView().getBindingContext();
	};
	b.prototype.onPayeeBankNavigationTargetsObtained = function (e) {
		this._popoverHandler.onPayeeBankNavigationTargetsObtained(e);
	};
	b.prototype.onBeforePayeeBankPopoverOpens = function (e) {
		this._popoverHandler.onBeforePayeeBankPopoverOpens(e);
	};
	b.prototype.onPayeeNavigationTargetsObtained = function (e) {
		this._popoverHandler.onPayeeNavigationTargetsObtained(e);
	};
	b.prototype.onBeforePayeePopoverOpens = function (e) {
		this._popoverHandler.onBeforePayeePopoverOpens(e);
	};
	return b;
}, true);