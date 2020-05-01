/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
/* global jQuery */
sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Context",
	"zfin/ap/zapprovebankpayments/model/formatter",
	"zfin/ap/zapprovebankpayments/model/Messaging",
	"zfin/ap/zapprovebankpayments/controller/detail/DraftController",
	"zfin/ap/zapprovebankpayments/controller/detail/DialogFactory"
	/* eslint-disable max-params */
], function(
	BaseObject,
	JSONModel,
	Context,
	formatter,
	Messaging,
	BatchDraftController,
	DialogFactory
) {

	var _oPaymentViewModel = new JSONModel({
		paymentAction: "",
		secondaryStatusView: "",
		PaymentActionFallback: "",
		batchEditable: false,
		isNewBatchEdit: false,
		useFallback: false,
		ignoreDocumentLink: false
	});

	var PaymentDetailPageExt = BaseObject.extend("zfin.ap.zapprovebankpayments.controller.detail.batch.BatchDetailPageExt", {
		constructor: function(component, view, extensionAPI) {
			this.component = component;
			this.view = view;
			this.extensionAPI = extensionAPI;
			this.messaging = Messaging;
			this.formatter = formatter;
			this.dialogFactory = DialogFactory;
			this.draftController = BatchDraftController;
		}
	});

	PaymentDetailPageExt.prototype.onInit = function() {
		this._oResourceBundle = this.component.getModel("@i18n").getResourceBundle();
		this.component.setModel(_oPaymentViewModel, "paymentView");
		this.extensionAPI.attachPageDataLoaded(this.onPagePaymentDataLoaded.bind(this));
		this.messaging.subscribeEvent(this.messaging.eventName.PAYMENT_TABLE_CHANGE, this.busSubscriber, this);
		this._setupInvoiceTable();
		this.view.bindElement({
			path: "",
			parameters: {
				expand: "to_Payee,to_Batch"
			},
			events: {
				dataReceived: function(event) {
					var payment = event.getParameter("data");
					this._onPaymentDataReady(payment);
				}.bind(this)
			}
		});
	};

	PaymentDetailPageExt.prototype.busSubscriber = function(channel, event, data) {
		var context = this.view.getBindingContext();
		this._onPaymentDataReady(context.getObject(), context, data.batch);
	};

	PaymentDetailPageExt.prototype.onPagePaymentDataLoaded = function(oEvent) {
		var context = oEvent.context;
		this._onPaymentDataReady(context.getObject(), context);
	};

	PaymentDetailPageExt.prototype._onPaymentDataReady = function(payment, context, batch) {
		var oPage = this.view.byId("objectPage");
		if (oPage) {
			oPage.getHeaderTitle().setObjectTitle(payment.PaymentDocument);
		}

		this._setButtonsAvailability(payment, context, batch);
	};

	PaymentDetailPageExt.prototype._setButtonsAvailability = function(payment, context, batch) {
		var action = payment.PaymentAction;
		var oBatch = batch;
		if (!oBatch) {
			oBatch = context ? context.getProperty("to_Batch") : payment.to_Batch;
		}
		var bIsNew = oBatch && (oBatch.ApprovalIsFirst || oBatch.IsReturnedApproval);

		_oPaymentViewModel.setProperty("/batchEditable", this.isBatchEditable(oBatch, new Context(this.view.getModel(), this._getBatchKey(payment))));
		_oPaymentViewModel.setProperty("/isNewBatchEdit", bIsNew && !oBatch.IsActiveEntity && !oBatch.PaymentBatchIsProcessed);
		_oPaymentViewModel.setProperty("/paymentAction", action);

		_oPaymentViewModel.setProperty("/secondaryStatusView", bIsNew && !oBatch.IsActiveEntity);
		_oPaymentViewModel.setProperty("/useFallback", bIsNew && !oBatch.IsActiveEntity && oBatch.PaymentBatchIsProcessed);
		_oPaymentViewModel.setProperty("/PaymentActionFallback", oBatch ? oBatch.PaymentBatchAction : undefined);

		_oPaymentViewModel.setProperty("/ignoreDocumentLink", !payment.BankPaymentGroupingOrigin.startsWith("FI"));
	};

	PaymentDetailPageExt.prototype.isBatchEditable = function(batch, context) {
		var lockUser = context.getProperty("DraftAdministrativeData/InProcessByUser");

		return batch && batch.IsActiveEntity && !lockUser;
	};

	PaymentDetailPageExt.prototype.onEditPaymentInstructionKey = function() {
		this.dialogFactory.askEditInstructionKey(this.view, [this.view.getBindingContext()])
			.then(function(sKey) {
				this._updatePayment({
					DataExchangeInstruction: sKey
				});
			}.bind(this));
	};

	PaymentDetailPageExt.prototype.deferPayment = function() {
		this.dialogFactory.askDeferDate(this.view)
			.then(function(date) {
				this._updatePayment({
					PaymentAction: "def",
					PaymentDeferDate: date
				});
			}.bind(this));
	};

	PaymentDetailPageExt.prototype.resetPayment = function() {
		this._updatePayment({
			PaymentAction: "",
			Status: "IBC01",
			PaymentDeferDate: null
		});
	};

	PaymentDetailPageExt.prototype.rejectPayment = function() {
		this._updatePayment({
			PaymentAction: "rej"
		});
	};

	PaymentDetailPageExt.prototype.onEditPayment = function() {
		var paymentContext = this.view.getBindingContext();
		var batchContext = this._getBatch();
		var batchInfo = {
			batchContext: batchContext
		};

		this.draftController.editableBatch(batchInfo, this.view, this.extensionAPI, paymentContext);
	};

	PaymentDetailPageExt.prototype._updatePayment = function(oValue) {
		var paymentContext = this.view.getBindingContext();
		var batchContext = this._getBatch();
		this.draftController.update([paymentContext], batchContext, oValue, this.extensionAPI)
			.then(function(batch) {
				this._onPaymentDataReady(paymentContext.getObject(), paymentContext, batch);
				this.messaging.publishEvent(this.messaging.eventName.PAYMENT_CHANGE, {
					batch: batch
				});
			}.bind(this));
	};

	PaymentDetailPageExt.prototype._getBatch = function() {
		var context = this.view.getBindingContext();
		var payment = this.view.getModel().getObject(context.getPath(), {
			expand: "to_Batch"
		});

		return new Context(this.view.getModel(), this._getBatchKey(payment));
	};

	PaymentDetailPageExt.prototype._getBatchKey = function(payment) {
		return "/" + this.view.getModel().createKey("C_AbpPaymentBatch", {
			PaymentBatch: payment.to_Batch.PaymentBatch,
			DraftUUID: payment.to_Batch.DraftUUID,
			IsActiveEntity: payment.to_Batch.IsActiveEntity
		});
	};

	PaymentDetailPageExt.prototype._setupInvoiceTable = function() {
		var invoiceTable = this.view.byId("to_Invoice::com.sap.vocabularies.UI.v1.LineItem::Table");
		if (invoiceTable) {
			invoiceTable.setUseVariantManagement(true);
		}
	};

	PaymentDetailPageExt.prototype.onExit = function(oValue) {
		this.extensionAPI.detachPageDataLoaded(this.onPagePaymentDataLoaded.bind(this));
		this.messaging.unsubscribeEvent(this.messaging.eventName.PAYMENT_TABLE_CHANGE, this.busSubscriber, this);
	};

	return PaymentDetailPageExt;
});