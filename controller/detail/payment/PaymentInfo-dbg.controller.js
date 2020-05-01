/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/Global",
	"sap/ui/model/Context",
	"sap/ui/core/mvc/Controller",
	"zfin/ap/zapprovebankpayments/model/formatter",
	"zfin/ap/zapprovebankpayments/controller/detail/DraftController",
	"zfin/ap/zapprovebankpayments/controller/detail/DialogFactory",
	"zfin/ap/zapprovebankpayments/model/PopoverHandler"
	/* eslint-disable max-params */
], function(
	GlobalUI,
	Context,
	BaseController,
	formatter,
	DraftController,
	DialogFactory,
	PopoverHandler
) {
	/* eslint-enable */
	"use strict";

	var _sComponent = "zfin.ap.zapprovebankpayments.controller.detail.payment.PaymentInfo";
	
	var Ctrl = BaseController.extend(_sComponent, {
		_draftController: DraftController,
		_eventBus: sap.ui.getCore().getEventBus(),
		_dialogFactory: DialogFactory,
		formatter: formatter,
		constructor: function() {}
	});
	
	Ctrl.prototype.onInit = function() {
		this._popoverHandler = new PopoverHandler(this.getView());
	};

	Ctrl.prototype.onExit = function() {
		this._popoverHandler.onExit();
	};

	Ctrl.prototype.paymentActionToStatus = function(sStatus, sPaymentAction, bUseFallback) {

		// bUseFallback from paymentView model is bound so that value is refreshed after paymentView changed (values from OData model already bound)
		var viewModel = this.getOwnerComponent().getModel("paymentView");
		var bAlternative = viewModel.getProperty("/secondaryStatusView");
		var fallbackAction = viewModel.getProperty("/PaymentActionFallback");

		var sAction = bUseFallback && !sPaymentAction ? fallbackAction : sPaymentAction;

		return this.formatter.paymentActionToStatus(sStatus, bAlternative, sAction);
	};

	Ctrl.prototype._getContext = function() {
		return this.getView().getBindingContext();
	};

	Ctrl.prototype.onPayeeBankNavigationTargetsObtained = function(oEvent) {
		this._popoverHandler.onPayeeBankNavigationTargetsObtained(oEvent);
	};

	Ctrl.prototype.onBeforePayeeBankPopoverOpens = function(oEvent) {
		this._popoverHandler.onBeforePayeeBankPopoverOpens(oEvent);
	};

	Ctrl.prototype.onPayeeNavigationTargetsObtained = function(oEvent) {
		this._popoverHandler.onPayeeNavigationTargetsObtained(oEvent);
	};

	Ctrl.prototype.onBeforePayeePopoverOpens = function(oEvent) {
		this._popoverHandler.onBeforePayeePopoverOpens(oEvent);
	};

	return Ctrl;
}, true);