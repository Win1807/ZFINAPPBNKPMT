/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"zfin/ap/zapprovebankpayments/model/batchDraftManual",
	"zfin/ap/zapprovebankpayments/model/Messaging"
], function(ManualDraft, Messaging) {
	"use strict";

	var _draftHandler = ManualDraft;
	var _messaging = Messaging;

	return {
		setResourceBundle: function(oBundle) {
			_draftHandler.setResourceBundle(oBundle);
		},

		editBatch: function(oBatchContext, bTakeOver) {
			return _draftHandler.editBatch(oBatchContext, bTakeOver);
		},

		update: function(oContext, oValue) {
			return _draftHandler.update(oContext, oValue);
		},

		processBatch: function(oBatchContext, oAction, bTakeOver) {
			return _draftHandler.processBatch(oBatchContext, oAction, bTakeOver);
		},

		processBatches: function(aBatchContexts, oAction, bTakeOver) {
			return _draftHandler.processBatches(aBatchContexts, oAction, bTakeOver);
		},

		submitReviewed: function(aBatchContexts, authCode) {
			return _draftHandler.submitReviewed(aBatchContexts, authCode);
		},

		undoBatch: function(oBatchContext, action) {
			return _draftHandler.undoBatch(oBatchContext, action);
		},

		undoBatches: function(aBatchContexts, action) {
			return _draftHandler.undoBatches(aBatchContexts, action);
		},

		isUnsavedChangesError: function(oError) {
			var code = _messaging.getBusinessLogicErrorCode(oError);
			return code === "SDRAFT_COMMON/006";
		}
	};
});