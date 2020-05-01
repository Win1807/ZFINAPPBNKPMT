/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["zfin/ap/zapprovebankpayments/model/batchDraftManual", "zfin/ap/zapprovebankpayments/model/Messaging"], function (M, a) {
	"use strict";
	var _ = M;
	var b = a;
	return {
		setResourceBundle: function (B) {
			_.setResourceBundle(B);
		},
		editBatch: function (B, t) {
			return _.editBatch(B, t);
		},
		update: function (c, v) {
			return _.update(c, v);
		},
		processBatch: function (B, A, t) {
			return _.processBatch(B, A, t);
		},
		processBatches: function (B, A, t) {
			return _.processBatches(B, A, t);
		},
		submitReviewed: function (B, c) {
			return _.submitReviewed(B, c);
		},
		undoBatch: function (B, c) {
			return _.undoBatch(B, c);
		},
		undoBatches: function (B, c) {
			return _.undoBatches(B, c);
		},
		isUnsavedChangesError: function (e) {
			var c = b.getBusinessLogicErrorCode(e);
			return c === "SDRAFT_COMMON/006";
		}
	};
});