/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
/*global Promise */
sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/Global",
	"sap/ui/model/json/JSONModel"
], function(BaseObject, UI, JSONModel) {
	"use strict";

	var confirmUndoDialogFragment = "zfin.ap.zapprovebankpayments.view.ConfirmUndoDialog";

	return BaseObject.extend("zfin.ap.zapprovebankpayments.controller.ConfirmUndoDialog", {
		_resolve: null,
		_reject: null,

		constructor: function(oView, context) {
			this._resourceBundle = oView.getModel("@i18n").getResourceBundle();
			this._oDialog = UI.xmlfragment(oView.createId("ConfirmUndoDialog"), confirmUndoDialogFragment, this);
			oView.addDependent(this._oDialog);
			this._oDialog.setModel(new JSONModel(this._getModel(context)), "action");

			return new Promise(function(fnResolve, fnReject) {
				this._resolve = fnResolve;
				this._reject = fnReject;
				this._oDialog.open();
			}.bind(this));
		},

		onUndoDialogOkPress: function() {
			this._oDialog.close();
			this._resolve({
				unprocessOnly: false
			});
		},

		onUndoDialogPartialPress: function() {
			this._oDialog.close();
			this._resolve({
				unprocessOnly: true
			});
		},

		onUndoDialogCancelPress: function() {
			this._oDialog.close();
			this._reject();
		},

		onAfterUndoClose: function() {
			this._oDialog.destroy();
		},

		_getModel: function(context) {
			var isMultiselect = Array.isArray(context);
			var model = {
				message: this._resourceBundle.getText(isMultiselect ? "confirmUndoMultiselectBatch" : "confirmUndoBatch"),
				title: this._resourceBundle.getText("confirmUndoChanges"),
				extraUndo: false
			};

			if (isMultiselect && context.length > 1) {
				model.message = this._resourceBundle.getText("confirmUndoMultiselectBatches", context.length);
			} else {
				this._adjustSingleBatchModel(model, (isMultiselect ? context[0] : context).getProperty());
			}

			return model;
		},

		_adjustSingleBatchModel: function(model, batch) {
			var paymentsEdited = (batch.ApprovalIsFirst || batch.IsReturnedApproval) && batch.PaymentBatchIsEdited;
			if (paymentsEdited && !batch.PaymentBatchIsProcessed) {
				model.message = this._resourceBundle.getText("confirmUndoPayments");
			} else if (paymentsEdited && batch.PaymentBatchIsProcessed) {
				model.title = this._resourceBundle.getText("confirmKeepOrDiscard");
				model.message = this._resourceBundle.getText("discardOrKeepQuestion");
				model.extraUndo = true;
			}
		}
	});
});