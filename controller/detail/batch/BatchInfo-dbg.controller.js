/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"zfin/ap/zapprovebankpayments/controller/detail/DraftController",
	"zfin/ap/zapprovebankpayments/controller/detail/DialogFactory",
	"zfin/ap/zapprovebankpayments/model/PopoverHandler",
	"zfin/ap/zapprovebankpayments/model/formatter",
	"zfin/ap/zapprovebankpayments/model/Messaging"
	/* eslint-disable max-params */
], function(
	BaseController,
	BatchDraftController,
	DialogFactory,
	PopoverHandler,
	formatter,
	Messaging
) {
	/* eslint-enable */
	"use strict";

	var _sComponent = "zfin.ap.zapprovebankpayments.controller.detail.batch.BatchInfo";
	var _messaging = Messaging;

	var _logRealError = function(oError) {
		if (oError) {
			_messaging.logError(oError, null, _sComponent);
		}
	};

	var Ctrl = BaseController.extend(_sComponent, {
		formatter: formatter,
		_dialogFactory: DialogFactory,
		_draftController: BatchDraftController,
		constructor: function() {}
	});

	Ctrl.prototype.onInit = function(oEvent) {
		this._popoverHandler = new PopoverHandler(this.getView());
	};

	Ctrl.prototype.onExit = function() {
		this._popoverHandler.onExit();
	};

	Ctrl.prototype.onMoreHouseBanksPress = function(oEvent) {
		this._popoverHandler.onMoreHouseBanksPress(oEvent);
	};

	Ctrl.prototype.onMoreAccountsPress = function(oEvent) {
		this._popoverHandler.onMoreAccountsPress(oEvent);
	};

	Ctrl.prototype.onBeforeHouseBankPopoverOpens = function(oEvent) {
		this._popoverHandler.onBeforeHouseBankPopoverOpens(oEvent);
	};

	Ctrl.prototype.onHouseBankNavigationTargetsObtained = function(oEvent) {
		this._popoverHandler.onHouseBankNavigationTargetsObtained(oEvent);
	};

	Ctrl.prototype.onHouseBankNavigationTargetsObtainedList = function(oEvent) {
		this._popoverHandler.onHouseBankNavigationTargetsObtainedList(oEvent);
	};

	Ctrl.prototype.onBeforeAccountPopoverOpens = function(oEvent) {
		this._popoverHandler.onBeforeAccountPopoverOpens(oEvent);
	};
	
	Ctrl.prototype.onAccountNavigationTargetsObtained = function(oEvent) {
		this._popoverHandler.onAccountNavigationTargetsObtained(oEvent);
	};

	Ctrl.prototype.onEditDueDatePress = function(oEvent) {
		var batch = this._getContext().getObject();
		var dueDateModel = {
			date: batch.DueDate ? batch.DueDate : batch.PaidItemDueDate
		};

		this._dialogFactory.askEditDueDate(this.getView(), dueDateModel)
			.then(this._setDueDate.bind(this))
			.catch(_logRealError);
	};

	Ctrl.prototype._setDueDate = function(dDate) {
		var context = this._getContext();
		return this._draftController.updateWithBatchMessages(context, {
				DueDate: dDate
			})
			.then(function(updateData) {
				if (updateData) {
					context.getModel().setProperty("DueDate", updateData.DueDate, context);
				}
			});
	};

	Ctrl.prototype._getContext = function() {
		return this.getView().getBindingContext();
	};

	return Ctrl;
}, true);