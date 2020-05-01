/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"zfin/ap/zapprovebankpayments/controller/detail/batch/ConfirmBatchActionDialog",
	"zfin/ap/zapprovebankpayments/controller/ConfirmUndoDialog",
	"zfin/ap/zapprovebankpayments/controller/DeferDateDialog",
	"zfin/ap/zapprovebankpayments/controller/detail/EditDueDateDialog",
	"zfin/ap/zapprovebankpayments/controller/detail/EditInstructionKeyDialog",
	"zfin/ap/zapprovebankpayments/controller/detail/batch/TakeOverDialog",
	"zfin/ap/zapprovebankpayments/model/deferAction"
	/* eslint-disable max-params */
], function(
	ConfirmBatchActionDialog,
	ConfirmUndoDialog,
	DeferDateDialog,
	EditDueDateDialog,
	EditInstructionKeyDialog,
	TakeOverDialog,
	DeferAction) {
	/* eslint-enable */
	"use strict";

	var _deferAction = DeferAction;
	var _editInstructionKey;

	return {
		askConfirmBatchAction: function(oView, oModel, oContext, aItems) {
			var oDialog = new ConfirmBatchActionDialog(oView, oModel, oContext, aItems);
			return oDialog.getPromise();
		},

		askConfirmUndo: function(oView, context) {
			return new ConfirmUndoDialog(oView, context);
		},

		askDeferDate: function(oView) {
			return new DeferDateDialog(oView);
		},

		askEditDueDate: function(oView, oModel) {
			return new EditDueDateDialog(oView, oModel);
		},

		askEditInstructionKey: function(oView, aPayments) {
			if (_editInstructionKey === undefined) {
				_editInstructionKey = new EditInstructionKeyDialog(oView);
			}

			return _editInstructionKey.selectInstructionKey(aPayments);
		},

		askTakeOver: function(oView, oModel) {
			return new TakeOverDialog(oView, oModel);
		},

		getDeferSettings: function() {
			return _deferAction.getDeferSettings();
		},

		checkDeferDaysPeriod: function(context) {
			_deferAction.checkDeferDaysPeriod(context);
		}
	};
});