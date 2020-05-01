/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/core/mvc/Controller", "zfin/ap/zapprovebankpayments/controller/detail/DraftController",
	"zfin/ap/zapprovebankpayments/controller/detail/DialogFactory", "zfin/ap/zapprovebankpayments/model/PopoverHandler",
	"zfin/ap/zapprovebankpayments/model/formatter", "zfin/ap/zapprovebankpayments/model/Messaging"
], function (B, a, D, P, f, M) {
	"use strict";
	var _ = "zfin.ap.zapprovebankpayments.controller.detail.batch.BatchInfo";
	var b = M;
	var c = function (e) {
		if (e) {
			b.logError(e, null, _);
		}
	};
	var C = B.extend(_, {
		formatter: f,
		_dialogFactory: D,
		_draftController: a,
		constructor: function () {}
	});
	C.prototype.onInit = function (e) {
		this._popoverHandler = new P(this.getView());
	};
	C.prototype.onExit = function () {
		this._popoverHandler.onExit();
	};
	C.prototype.onMoreHouseBanksPress = function (e) {
		this._popoverHandler.onMoreHouseBanksPress(e);
	};
	C.prototype.onMoreAccountsPress = function (e) {
		this._popoverHandler.onMoreAccountsPress(e);
	};
	C.prototype.onBeforeHouseBankPopoverOpens = function (e) {
		this._popoverHandler.onBeforeHouseBankPopoverOpens(e);
	};
	C.prototype.onHouseBankNavigationTargetsObtained = function (e) {
		this._popoverHandler.onHouseBankNavigationTargetsObtained(e);
	};
	C.prototype.onHouseBankNavigationTargetsObtainedList = function (e) {
		this._popoverHandler.onHouseBankNavigationTargetsObtainedList(e);
	};
	C.prototype.onBeforeAccountPopoverOpens = function (e) {
		this._popoverHandler.onBeforeAccountPopoverOpens(e);
	};
	C.prototype.onAccountNavigationTargetsObtained = function (e) {
		this._popoverHandler.onAccountNavigationTargetsObtained(e);
	};
	C.prototype.onEditDueDatePress = function (e) {
		var d = this._getContext().getObject();
		var g = {
			date: d.DueDate ? d.DueDate : d.PaidItemDueDate
		};
		this._dialogFactory.askEditDueDate(this.getView(), g).then(this._setDueDate.bind(this)).catch(c);
	};
	C.prototype._setDueDate = function (d) {
		var e = this._getContext();
		return this._draftController.updateWithBatchMessages(e, {
			DueDate: d
		}).then(function (u) {
			if (u) {
				e.getModel().setProperty("DueDate", u.DueDate, e);
			}
		});
	};
	C.prototype._getContext = function () {
		return this.getView().getBindingContext();
	};
	return C;
}, true);