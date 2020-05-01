/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/Global", "sap/ui/base/Object"], function (G, B) {
	"use strict";
	var _;
	var a;

	function b(e, f, m) {
		var p = e.getParameters();
		p.show(m, p.mainNavigation, p.actions, G.xmlfragment("zfin.ap.zapprovebankpayments.view." + f));
	}

	function c(p) {
		var d = p ? p.getProperty("to_Batch") : undefined;
		return d ? d.CompanyCode : undefined;
	}
	var C = B.extend("zfin.ap.zapprovebankpayments.model.PopoverHandler", {
		constructor: function (v) {
			this.view = v;
		}
	});
	C.prototype.onExit = function () {
		[a, _].forEach(function (i) {
			if (i) {
				i.destroy();
			}
		});
		a = null;
		_ = null;
	};
	C.prototype.onMoreHouseBanksPress = function (e) {
		var o = e.getSource();
		if (!_) {
			_ = this._loadFragment("moreBanksPopover", "MoreBanksPopover");
		}
		_.setBindingContext(o.getBindingContext());
		_.openBy(o);
	};
	C.prototype.onMoreAccountsPress = function (e) {
		var o = e.getSource();
		if (!a) {
			a = this._loadFragment("moreAccountsPopover", "MoreAccountsPopover");
		}
		a.setBindingContext(o.getBindingContext());
		a.openBy(o);
	};
	C.prototype.onBeforeHouseBankPopoverOpens = function (e) {
		var p = e.getParameters();
		p.setSemanticAttributes({
			Bank: p.semanticAttributes.BankInternalID,
			BankCountry: p.semanticAttributes.BankCountry,
			HouseBank: p.semanticAttributes.HouseBank
		});
		p.open();
	};
	C.prototype.onHouseBankNavigationTargetsObtained = function (e) {
		b(e, "HouseBankPopover");
	};
	C.prototype.onHouseBankNavigationTargetsObtainedList = function (e) {
		b(e, "HouseBankPopoverFromList");
	};
	C.prototype.onBeforeAccountPopoverOpens = function (e) {
		var p = e.getParameters();
		var d = p.semanticAttributes;
		var f = d.CompanyCode ? d.CompanyCode : d.PayingCompanyCode;
		p.setSemanticAttributes({
			CompanyCode: f,
			HouseBank: d.HouseBank,
			HouseBankAccount: d.HouseBankAccount
		});
		p.open();
	};
	C.prototype.onAccountNavigationTargetsObtained = function (e) {
		b(e, "batch.AccountPopover");
	};
	C.prototype.onBeforeDocumentPopoverOpens = function (e) {
		var p = e.getParameters();
		p.setSemanticAttributes({
			AccountingDocument: p.semanticAttributes.AccountingDocument,
			CompanyCode: p.semanticAttributes.CompanyCode,
			DocumentType: "3",
			FiscalYear: p.semanticAttributes.FiscalYear
		}, "AccountingDocument");
		p.setSemanticAttributes({
			AccountingDocument: p.semanticAttributes.AccountingDocument,
			CompanyCode: p.semanticAttributes.CompanyCode,
			CustomClearingStatus: "A"
		}, "Supplier");
		p.open();
	};
	C.prototype.onBeforePayeeBankPopoverOpens = function (e) {
		var p = e.getParameters();
		p.setSemanticAttributes({
			Bank: p.semanticAttributes.PayeeBankInternalID,
			BankCountry: p.semanticAttributes.PayeeBankCountry
		});
		p.open();
	};
	C.prototype.onPayeeBankNavigationTargetsObtained = function (e) {
		b(e, "payment.PayeeBankPopover");
	};
	C.prototype.onBeforePayeePopoverOpens = function (e) {
		var p = e.getParameters();
		p.setSemanticAttributes({
			Supplier: p.semanticAttributes.Supplier
		});
		p.open();
	};
	C.prototype.onPayeeNavigationTargetsObtained = function (e) {
		b(e, "payment.PayeePopover", "");
	};
	C.prototype.onBeforePaymentPopoverOpens = function (e) {
		var p = e.getParameters();
		var d = c(e.getSource().getBindingContext());
		var g = p.semanticAttributes.BankPaymentGroupingOrigin;
		var f = g && g.startsWith("FI") ? "4" : "3";
		p.setSemanticAttributes({
			RunId: p.semanticAttributes.PaymentRunID,
			CompanyCode: d
		}, "AutomaticPayment");
		p.setSemanticAttributes({
			AccountingDocument: p.semanticAttributes.AccountingDocument,
			CompanyCode: d,
			DocumentType: f,
			FiscalYear: p.semanticAttributes.FiscalYear
		}, "AccountingDocument");
		p.open();
	};
	C.prototype._loadFragment = function (i, p) {
		var f = "zfin.ap.zapprovebankpayments.view." + p;
		var d = G.xmlfragment(this.view.createId(i), f, this.view.getController());
		this.view.addDependent(d);
		return d;
	};
	return C;
}, true);