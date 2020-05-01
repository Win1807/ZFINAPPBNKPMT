/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
    "sap/ui/thirdparty/jquery",
    "sap/ui/base/Object",
    "sap/ui/Global",
    "sap/ui/model/json/JSONModel",
    "zfin/ap/zapprovebankpayments/model/formatter"
	/* eslint-disable max-params */
], function(jQuery, Parent, UI, JSONModel, formatter) {
	/* eslint-enable max-params */
	"use strict";

	var CONFIRM_DIALOG_FRAGMENT = "zfin.ap.zapprovebankpayments.view.batch.ConfirmActionDialog";

	/**
	 * @class
	 * 
	 * A class which implements Confirm Master Action Dialog
	 * 
	 * @extends sap.ui.base.Object
	 */
	return Parent.extend("zfin.ap.zapprovebankpayments.controller.detail.batch.ConfirmBatchActionDialog", {

		formatter: formatter,

		/**
		 * Constructor for Confirm Master Action Dialog
		 *
		 * @param {sap.ui.core.mvc.View} oView     object with data and references of current view
		 * @param {object}               oActionContext   selected action to perform etc.
		 * @param {object}               oBatchBinding batch binding
		 * @param {array}                aPayments available payments
		 *
		 * @return {void}
		 */
		constructor: function(oView, oActionContext, oBatchBinding, aPayments) {
			var model = new JSONModel(oActionContext);
			var oActionToText = {
				"app": "masterSelectedBatchesApprove",
				"def": "masterSelectedBatchesDefer",
				"rej": "masterSelectedBatchesReject",
				"ret": "masterSelectedBatchesReturn"
			};

			this._oBatchBinding = oBatchBinding;
			this._aPayments = aPayments;
			this._oDeffered = jQuery.Deferred();
			this._oDialog = UI.xmlfragment(oView.createId("ConfirmActionDialog"), CONFIRM_DIALOG_FRAGMENT, this);
			this._oView = oView;
			this._sAction = oActionContext.action;
			this._sActionText = this.getResourceBundle().getText(oActionToText[oActionContext.action]);
			this._isRejectWithNote = oActionContext.isReject;

			this._oView.addDependent(this._oDialog);

			model.setProperty("/actionEnabled", false);
			this._oDialog.setModel(model, "action");
		},

		/**
		 * Opens dialog and gets user's note as a promise
		 * 
		 * @return {jQuery.Deferred} a promise
		 */
		getPromise: function() {
			var title = this.getResourceBundle().getText("userConfirmDialogBatchTitle", [this._sActionText]);
			this._getActionModel().setProperty("/title", title);

			this.getStatistic();

			this._oDialog.open();

			return this._oDeffered;
		},

		/**
		 * Gets statistics of the current action
		 * 
		 * @return {void}
		 */
		getStatistic: function() {
			var oStatisticModel = new JSONModel({
				isMaster: false
			});

			var firstStage = this._oBatchBinding.getProperty("ApprovalIsFirst") ||
				this._oBatchBinding.getProperty("IsReturnedApproval");
			var paymentCount = this._oBatchBinding.getProperty("NumberOfPayments");
			var serverRead = firstStage && (!this._aPayments || this._aPayments.length !== paymentCount);
			var actions;

			this._oDialog.setModel(oStatisticModel, "stats");
			oStatisticModel.setProperty("/mismatchError", false);
			oStatisticModel.setProperty("/reading", serverRead);
			if (serverRead) {
				this._readServerStatistics();
			} else if (!firstStage) {
				oStatisticModel.setProperty("/" + this._sAction, paymentCount);
				this._getActionModel().setProperty("/actionEnabled", this._canSubmit());
			} else {
				actions = this._aPayments.map(function(payment) {
					return payment.getBindingContext().getProperty("PaymentAction");
				});
				this._processPaymentsActions(actions);
			}
		},

		/**
		 * Gets resource bundle
		 *
		 * @return {sap.ui.model.resource.ResourceModel} resource model of the component
		 */
		getResourceBundle: function() {
			return this._oView.getModel("@i18n").getResourceBundle();
		},

		/**
		 * Dialog's success action
		 *
		 * @return {void}
		 */
		onConfirmDialogOkPress: function() {
			var model = this._getActionModel();
			var actionContext = {
				action: this._sAction,
				note: model.getProperty("/note"),
				isDefer: model.getProperty("/isDefer"),
				deferDate: this.formatter.dateTimeToDate(model.getProperty("/deferDate"))
			};

			this._oDeffered.resolve(actionContext);
			this._oDialog.close();
		},

		/**
		 * Dialog's cancel action
		 *
		 * @return {void}
		 */
		onConfirmDialogCancelPress: function() {
			this._oDeffered.reject();
			this._oDialog.close();
		},

		/**
		 * Handles 'afterClose' event
		 * 
		 * @return {void}
		 */
		onAfterClose: function() {
			this._oDialog.destroy();
		},

		handleLiveChange: function(oEvent) {
			var noteIsEmpty = oEvent.getParameter("value").length === 0;
			var isReject = this._getActionModel().getProperty("/isReject");
			if (isReject) {
                this._setRejWithNote(noteIsEmpty);
			}
		},

		_readServerStatistics: function() {
			var sPath = this._oBatchBinding.getPath();
			var oReadParameters = {
				success: function(oData) {
					var actions = oData.results.map(function(payment) {
						return payment.PaymentAction;
					});
					this._processPaymentsActions(actions);
				}.bind(this),
				urlParameters: {
					"$select": "PaymentAction"
				}
			};

			this._oBatchBinding.getModel().read(sPath + "/to_Payment", oReadParameters);
		},

		_processPaymentsActions: function(aActions) {
			var oStatisticModel = this._oDialog.getModel("stats");
			aActions.forEach(function(sAction) {
				var action = sAction ? sAction : this._sAction;
				var iQuantity = oStatisticModel.getProperty("/" + action) || 0;
				oStatisticModel.setProperty("/" + action, iQuantity + 1);
			}, this);

			this._finalizeStatisticsRead();

		},

		_finalizeStatisticsRead: function() {
			var stats = this._oDialog.getModel("stats");
			var action = this._getActionModel();
			if (!action.getProperty("/isReject") &&
				stats.getProperty("/rej")) {
				action.setProperty("/isReject", true);
				this._setRejWithNote(!action.getProperty("/note"));
			}

			stats.setProperty("/reading", false);
			if (!this._setEnableSubmitButton()) {
				stats.setProperty("/mismatchError", true);
			}
		},

		_canSubmit: function() {
			return !this._isRejectWithNote;
		},

		_setEnableSubmitButton: function() {
			var action = this._getActionModel();
			var stats = this._oDialog.getModel("stats");
			var batchActionHonored = !!stats.getProperty("/" + this._sAction);

			action.setProperty("/actionEnabled", batchActionHonored && this._canSubmit());

			return batchActionHonored;
		},

		_setRejWithNote: function(enable) {
			this._isRejectWithNote = enable;
			this._setEnableSubmitButton();
		},

		_getActionModel: function() {
			return this._oDialog.getModel("action");
		}
	});
});