/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/m/UploadCollectionParameter",
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/unified/FileUploaderParameter",
	"zfin/ap/zapprovebankpayments/model/Messaging",
	"zfin/ap/zapprovebankpayments/model/formatter"
	/* eslint-disable max-params */
], function(
	UploadCollectionParameter,
	BaseController,
	Filter,
	FilterOperator,
	FileUploaderParameter,
	Messaging,
	formatter
) {
	/* eslint-enable */
	"use strict";

	var _messaging = Messaging;

	function _getFileName(fullName) {
		var dotIndex = fullName ? fullName.lastIndexOf(".") : -1;
		return dotIndex > 0 ? fullName.substring(0, dotIndex) : "";
	}

	function _getFileExtension(fullName) {
		var dotIndex = fullName ? fullName.lastIndexOf(".") : -1;
		return dotIndex > 0 ? fullName.substring(dotIndex + 1) : "";
	}

	function _getSlugParameterValue(draftUuid, file) {
		var fileName = _getFileName(file);
		var fileExtension = _getFileExtension(file);
		return "Draftuuid=guid'" + draftUuid + "';Filename='" + fileName + "';FileExtension='" + fileExtension + "';Description=''";
	}

	var Ctrl = BaseController.extend("zfin.ap.zapprovebankpayments.controller.detail.batch.Attachments", {
		formatter: formatter,
		constructor: function() {}
	});

	Ctrl.prototype.onBeforeUploadStarts = function(oEvent) {
		var params = oEvent.getParameters();
		var draftUuid = this._getBindingContext().getProperty("DraftUUID");

		var oCustomerHeaderSlug = new UploadCollectionParameter({
			name: "slug",
			value: _getSlugParameterValue(draftUuid, params.fileName)
		});

		params.addHeaderParameter(oCustomerHeaderSlug);
		_messaging.actionStarted(this._getText("uploadAttachment"));
	};

	Ctrl.prototype.onAttachmentDeleted = function(oEvent) {
		this._editAttachment(oEvent, "del");
	};

	Ctrl.prototype.onAttachmentChange = function(oEvent) {
		var token = this.getOwnerComponent().getModel().getSecurityToken();
		var oUploadCollection = oEvent.getSource();
		var oCustomerHeaderToken = new UploadCollectionParameter({
			name: "x-csrf-token",
			value: token
		});

		oUploadCollection.addHeaderParameter(oCustomerHeaderToken);
	};

	Ctrl.prototype.onAttachmentRenamed = function(oEvent) {
		this._editAttachment(oEvent, "ren");
	};

	Ctrl.prototype.onAttachmentsSelectionChange = function(oEvent) {
		var somethingSelected = oEvent.getSource().getSelectedItems().length > 0;
		this._getViewModel().setProperty("/attachmentSelected", somethingSelected);
	};

	Ctrl.prototype.onAttachmentsUploadComplete = function(oEvent) {
		var files = oEvent.getParameters().files;
		var idx;
		for (idx = 0; files && idx < files.length; idx++) {
			if (files[idx].status !== 201 && // uploaded
				files[idx].status !== 0) { // cancelled
				_messaging.addActionError(files[idx]);
			}
		}

		_messaging.actionFinished();
		this._refreshAttachments(this.getView().byId("uploadCollection"));
	};

	Ctrl.prototype.onSearchAttachments = function(oEvent) {
		var oAttachmentsContainer = this.getView().byId("uploadCollection");
		var sQuery = oEvent.getParameter("query");
		var oFilter = new Filter("Filename", FilterOperator.Contains, sQuery);
		var oBinding = oAttachmentsContainer.getBinding("items");
		oBinding.filter([oFilter]);
	};

	Ctrl.prototype._refreshAttachments = function(attachmentsControl) {
		var viewModel = this._getViewModel();
		var model = this.getView().getModel();
		attachmentsControl.setBusy(true);
		var readFinished = function() {
			attachmentsControl.setBusy(false);
			viewModel.setProperty("/attachmentSelected", attachmentsControl.getSelectedItems().length > 0);
		};

		model.invalidateEntry(this._getBindingContext());
		model.read(this._getBindingContext() + "/GetAttachment", {
			success: function(data) {
				var attachments = data.results;
				attachments.forEach(function(a) {
					a.DownloadUrl = "/sap/opu/odata/sap/FAP_APPROVEBANKPAYMENTS_SRV/AttachmentDownloadSet(ID='" + a.AttachmId + "')/$value";
				});

				viewModel.setProperty("/attachments", attachments);
				readFinished();
			},
			error: readFinished
		});
	};

	Ctrl.prototype._editAttachment = function(oEvent, action) {
		var src = oEvent.getSource();
		var key = action === "del" ? "deleteAttachment" : "renameAttachment";
		_messaging.actionStarted(this._getText(key));
		this._getBindingContext().getModel().callFunction(
			"/editAttachment", {
				urlParameters: {
					Action: action,
					Filename: _getFileName(oEvent.getParameter("fileName")),
					ID: oEvent.getParameter("documentId")
				},
				method: "POST",
				success: function(result) {
					if (!result.Edited) {
						_messaging.addActionError();
					}

					_messaging.actionFinished();
					this._refreshAttachments(src);
				}.bind(this),
				error: function(error) {
					_messaging.addActionError(error);
					_messaging.actionFinished();
					this._refreshAttachments(src);
				}.bind(this)
			});
	};

	Ctrl.prototype._getBindingContext = function() {
		return this.getView().getBindingContext();
	};

	Ctrl.prototype._getViewModel = function() {
		return this.getView().getModel("batchView");
	};

	Ctrl.prototype._getText = function() {
		var i18n = this.getOwnerComponent().getModel("@i18n").getResourceBundle();
		return i18n.getText.apply(i18n, arguments);
	};

	return Ctrl;
}, true);