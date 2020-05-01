/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/m/library",
	"sap/ui/core/format/NumberFormat",
	"sap/ui/core/format/DateFormat",
	"sap/ui/core/library",
	"sap/ui/core/Locale",
	"sap/ui/core/format/FileSizeFormat",
	"zfin/ap/zapprovebankpayments/model/statusGroups",
	"zfin/ap/zapprovebankpayments/model/Constants"
	/* eslint-disable max-params */
], function(
	mobileLibrary,
	NumberFormat,
	DateFormat,
	coreLibrary,
	Locale,
	FileSizeFormat,
	StatusGroups,
	Constants
) {
	/* eslint-enable */
	"use strict";

	var ValueState = coreLibrary.ValueState;
	var ListMode = mobileLibrary.ListMode;
	var _oResourceBundle = null;

	var _getResourceText = function(sKey, aParams) {
		return _oResourceBundle ? _oResourceBundle.getText(sKey, aParams) : sKey;
	};

	var _formatFloat = function(oValue, oFormatOptions, locale) {
		if (!oValue) {
			return "";
		}

		var oFloatFormatter = NumberFormat.getFloatInstance(oFormatOptions, locale);
		return oFloatFormatter.format(oValue);
	};

	var _getTaskStatus = function(sKey) {
		var oGroup = StatusGroups.getGroupByStatusValue(sKey);
		return oGroup ? oGroup.status : null;
	};

	var _numberOfItems = function(sNumber, sSingularKey, sPluralKey) {
		var iNumberOfPayments;
		var sKey;

		if (!sNumber || sNumber.length === 0) {
			return "";
		}

		iNumberOfPayments = Number(sNumber);
		sKey = iNumberOfPayments === 1 ? sSingularKey : sPluralKey;

		return _getResourceText(sKey, [iNumberOfPayments]);
	};

	var _formatDateMedium = function(dDate) {
		return dDate ? DateFormat.getInstance({
			style: "medium"
		}).format(dDate) : dDate;
	};

	var _formatDateTimeMedium = function(dDate) {
		return dDate ? DateFormat.getDateTimeInstance({
			style: "medium/short"
		}).format(dDate) : dDate;
	};

	return {

		statusCodeToStatus: function(sValue) {
			var oGroup = StatusGroups.getGroupByStatusValue(sValue);
			return oGroup ? oGroup.status : ValueState.None;
		},

		longFloatValue: function(sValue, locale) {
			return _formatFloat(sValue, {
				minFractionDigits: 2,
				maxFractionDigits: 2
			}, locale ? new Locale(locale) : null);
		},

		numberOfBatches: function(sNumber) {
			return _numberOfItems(sNumber, "masterNumberOfBatchesSingular", "masterNumberOfBatchesPlural");
		},

		numberOfPayments: function(sNumber) {
			return _numberOfItems(sNumber, "masterNumberOfPaymentsSingular", "masterNumberOfPaymentsPlural");
		},

		composeCodeName: function(sCode, sName) {
			var text = "";
			if (sCode && sName) {
				text = _getResourceText("detailCodeAndName", [sCode, sName]);
			} else if (sCode) {
				text = sCode;
			} else if (sName) {
				text = sName;
			}

			return text;
		},

		paymentBatchTitle: function(code) {
			var text = "";
			if (code) {
				text = _getResourceText("detailPaymentBatch", [code]);
			}

			return text;
		},

		mediumDate: function(dDate) {
			return _formatDateMedium(dDate);
		},

		mediumDateTime: function(oDate) {
			return _formatDateTimeMedium(oDate);
		},

		mediumDateCoalesce: function(dDate1, dDate2) {
			return _formatDateMedium(dDate1 ? dDate1 : dDate2);
		},

		formatUrgentFlagStatus: function(sFlag) {
			var flagState;
			var i;

			for (i = 0; i < Constants.PAYMENT_URGENT_FLAG_STATE.length; i++) {
				if (sFlag === Constants.PAYMENT_URGENT_FLAG_STATE[i].abbr) {
					flagState = Constants.PAYMENT_URGENT_FLAG_STATE[i].flagState;
					break;
				}
			}

			if (flagState) {
				return flagState;
			} else {
				return ValueState.None;
			}
		},

		isFinalToStatus: function(value) {
			return value ? ValueState.Warning : ValueState.None;
		},

		isUrgentPayment: function(sFlag) {
			return sFlag === "A" || sFlag === "P";
		},

		formatFlagLinguistic: function(bFlag) {
			return _getResourceText(bFlag ? "detailItemFlagIsSet" : "detailItemFlagIsNotSet");
		},

		paymentUrgentState: function(bFlag) {
			return bFlag ? ValueState.Error : ValueState.None;
		},

		setResourceBundle: function(oBundle) {
			_oResourceBundle = oBundle;
		},

		paymentActionToStatus: function(sStatus, bAlternative, sAction) {
			var status;
			if (bAlternative) {
				status = _getTaskStatus(sAction);
			}

			if (!status) {
				status = _getTaskStatus(sStatus);
			}

			return status ? status : ValueState.None;
		},

		formatBytes: function(sValue) {
			return FileSizeFormat.getInstance({
				binaryFilesize: false,
				maxFractionDigits: 1,
				maxIntegerDigits: 3
			}).format(sValue);
		},

		dateTimeToDate: function(oDate) {
			if (!oDate || !(oDate instanceof Date)) {
				return null;
			}

			return new Date(Date.UTC(
				oDate.getFullYear(),
				oDate.getMonth(),
				oDate.getDate()
			));
		},

		historyIcon: function(icon) {
			var selectedIcon = icon ? icon : "activity-items";
			return "sap-icon://" + selectedIcon;
		},

		tableMode: function(bEditable) {
			return bEditable ? ListMode.MultiSelect : ListMode.None;
		}
	};
});