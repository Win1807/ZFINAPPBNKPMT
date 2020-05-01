/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
], function() {
	"use strict";

	var paymentAllwaysRequest = [
		"BankCountry",
		"BankPaymentGroupingOrigin",
		"FiscalYear",
		"IsUrgentPayment",
		"PayeeBankCountry",
		"PayeeBankInternalID",
		"PayeeBankName",
		"PaymentAction",
		"PaymentBatchItem",
		"PaymentDeferDate",
		"PaymentRunID",
		"PaymentMethod",
		"Status",
		"to_Batch/ApprovalIsFirst",
		"to_Batch/IsReturnedApproval",
		"to_Batch/PaymentBatchIsProcessed",
		"to_Batch/PaymentBatchAction",
		"to_Batch/PaymentBatchDeferDate"
	];

	var draftAllwaysRequest = [
		"DraftUUID",
		"IsActiveEntity"
	];

	var paymentsIgnore = [
		"IsUrgentPayment",
		"PaymentAction",
		"PaymentDeferDate",
		"PaymentRunIsProposal",
		"Status",
		"StatusProfile",
		"SystemStatusName",
		"SystemStatusShortName"
	];

	var draftIgnore = [
		"DraftEntityCreationDateTime",
		"DraftEntityLastChangeDateTime",
		"DraftUUID",
		"HasActiveEntity",
		"HasDraftEntity",
		"IsActiveEntity",
		"ParentDraftUUID",
		"Preparation_ac",
		"Validation_ac"
	];

	return {
		standardSettings: {
			requestAtLeast: paymentAllwaysRequest.concat(draftAllwaysRequest).join(","),
			ignored: paymentsIgnore.concat(draftIgnore).join(",")
		},

		excludeSettings: {
			requestAtLeast: paymentAllwaysRequest.join(","),
			ignored: paymentsIgnore.join(",")
		}
	};
});