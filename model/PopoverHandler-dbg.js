/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/Global",
	"sap/ui/base/Object"
], function(
	GlobalUI,
	BaseObject
) {
	"use strict";

	var _oMoreBanksPopover;
	var _oMoreAccountsPopover;

	function _onTargetsObtained(oEvent, file, mainNavigationId) {
		var params = oEvent.getParameters();
		params.show(
			mainNavigationId,
			params.mainNavigation,
			params.actions,
			GlobalUI.xmlfragment("zfin.ap.zapprovebankpayments.view." + file));
	}
	
	function _getPaymentCompanyCode(paymentContext) {
		var batch = paymentContext ? paymentContext.getProperty("to_Batch") : undefined;
		return batch ? batch.CompanyCode : undefined;
	}

	var Ctrl = BaseObject.extend("zfin.ap.zapprovebankpayments.model.PopoverHandler", {
		constructor: function(view) {
			this.view = view;
		}
	});

	Ctrl.prototype.onExit = function() {
		[
			_oMoreAccountsPopover,
			_oMoreBanksPopover
		].forEach(function(item) {
			if (item) {
				item.destroy();
			}
		});

		_oMoreAccountsPopover = null;
		_oMoreBanksPopover = null;
	};

	Ctrl.prototype.onMoreHouseBanksPress = function(oEvent) {
		var oControl = oEvent.getSource();
		if (!_oMoreBanksPopover) {
			_oMoreBanksPopover = this._loadFragment("moreBanksPopover", "MoreBanksPopover");
		}

		_oMoreBanksPopover.setBindingContext(oControl.getBindingContext());
		_oMoreBanksPopover.openBy(oControl);
	};

	Ctrl.prototype.onMoreAccountsPress = function(oEvent) {
		var oControl = oEvent.getSource();
		if (!_oMoreAccountsPopover) {
			_oMoreAccountsPopover = this._loadFragment("moreAccountsPopover", "MoreAccountsPopover");
		}

		_oMoreAccountsPopover.setBindingContext(oControl.getBindingContext());
		_oMoreAccountsPopover.openBy(oControl);
	};

	Ctrl.prototype.onBeforeHouseBankPopoverOpens = function(oEvent) {
		var params = oEvent.getParameters();
		params.setSemanticAttributes({
			Bank: params.semanticAttributes.BankInternalID,
			BankCountry: params.semanticAttributes.BankCountry,
			HouseBank: params.semanticAttributes.HouseBank
		});

		params.open();
	};

	Ctrl.prototype.onHouseBankNavigationTargetsObtained = function(oEvent) {
		_onTargetsObtained(oEvent, "HouseBankPopover");
	};

	Ctrl.prototype.onHouseBankNavigationTargetsObtainedList = function(oEvent) {
		_onTargetsObtained(oEvent, "HouseBankPopoverFromList");
	};

	Ctrl.prototype.onBeforeAccountPopoverOpens = function(oEvent) {
		var params = oEvent.getParameters();
		var attributes = params.semanticAttributes;
		var companyCode = attributes.CompanyCode ? attributes.CompanyCode : attributes.PayingCompanyCode;
		params.setSemanticAttributes({
			CompanyCode: companyCode,
			HouseBank: attributes.HouseBank,
			HouseBankAccount: attributes.HouseBankAccount
		});

		params.open();
	};

	Ctrl.prototype.onAccountNavigationTargetsObtained = function(oEvent) {
		_onTargetsObtained(oEvent, "batch.AccountPopover");
	};

	Ctrl.prototype.onBeforeDocumentPopoverOpens = function(oEvent) {
		var params = oEvent.getParameters();
		params.setSemanticAttributes({
			AccountingDocument: params.semanticAttributes.AccountingDocument,
			CompanyCode: params.semanticAttributes.CompanyCode,
			DocumentType: "3",
			FiscalYear: params.semanticAttributes.FiscalYear
		}, "AccountingDocument");

		params.setSemanticAttributes({
			AccountingDocument: params.semanticAttributes.AccountingDocument,
			CompanyCode: params.semanticAttributes.CompanyCode,
			CustomClearingStatus: "A"
		}, "Supplier");

		params.open();
	};
	
	Ctrl.prototype.onBeforePayeeBankPopoverOpens = function(oEvent) {
		var params = oEvent.getParameters();
		params.setSemanticAttributes({
			Bank: params.semanticAttributes.PayeeBankInternalID,
			BankCountry: params.semanticAttributes.PayeeBankCountry
		});

		params.open();
	};

	Ctrl.prototype.onPayeeBankNavigationTargetsObtained = function(oEvent) {
		_onTargetsObtained(oEvent, "payment.PayeeBankPopover");
	};

	Ctrl.prototype.onBeforePayeePopoverOpens = function(oEvent) {
		var params = oEvent.getParameters();
		params.setSemanticAttributes({
			Supplier: params.semanticAttributes.Supplier
		});

		params.open();
	};
	
	Ctrl.prototype.onPayeeNavigationTargetsObtained = function(oEvent) {
		_onTargetsObtained(oEvent, "payment.PayeePopover", "");
	};

	Ctrl.prototype.onBeforePaymentPopoverOpens = function(oEvent) {
		var params = oEvent.getParameters();
		var companyCode = _getPaymentCompanyCode(oEvent.getSource().getBindingContext());
		var grouping = params.semanticAttributes.BankPaymentGroupingOrigin;
		var docType = grouping && grouping.startsWith("FI") ? "4" : "3";

		params.setSemanticAttributes({
			RunId: params.semanticAttributes.PaymentRunID,
			CompanyCode: companyCode
		}, "AutomaticPayment");

		params.setSemanticAttributes({
			AccountingDocument: params.semanticAttributes.AccountingDocument,
			CompanyCode: companyCode,
			DocumentType: docType,
			FiscalYear: params.semanticAttributes.FiscalYear
		}, "AccountingDocument");

		params.open();
	};

	Ctrl.prototype._loadFragment = function(sId, sPath) {
		var fullPath = "zfin.ap.zapprovebankpayments.view." + sPath;
		var fragment = GlobalUI.xmlfragment(this.view.createId(sId), fullPath, this.view.getController());
		this.view.addDependent(fragment);
		return fragment;
	};

	return Ctrl;

}, true);