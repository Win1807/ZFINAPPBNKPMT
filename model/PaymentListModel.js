/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([], function () {
	"use strict";
	var p = ["BankCountry", "BankPaymentGroupingOrigin", "FiscalYear", "IsUrgentPayment", "PayeeBankCountry", "PayeeBankInternalID",
		"PayeeBankName", "PaymentAction", "PaymentBatchItem", "PaymentDeferDate", "PaymentRunID", "PaymentMethod", "Status",
		"to_Batch/ApprovalIsFirst", "to_Batch/IsReturnedApproval", "to_Batch/PaymentBatchIsProcessed", "to_Batch/PaymentBatchAction",
		"to_Batch/PaymentBatchDeferDate"
	];
	var d = ["DraftUUID", "IsActiveEntity"];
	var a = ["IsUrgentPayment", "PaymentAction", "PaymentDeferDate", "PaymentRunIsProposal", "Status", "StatusProfile", "SystemStatusName",
		"SystemStatusShortName"
	];
	var b = ["DraftEntityCreationDateTime", "DraftEntityLastChangeDateTime", "DraftUUID", "HasActiveEntity", "HasDraftEntity",
		"IsActiveEntity", "ParentDraftUUID", "Preparation_ac", "Validation_ac"
	];
	return {
		standardSettings: {
			requestAtLeast: p.concat(d).join(","),
			ignored: a.concat(b).join(",")
		},
		excludeSettings: {
			requestAtLeast: p.join(","),
			ignored: a.join(",")
		}
	};
});