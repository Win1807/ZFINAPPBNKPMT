/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/m/UploadCollectionParameter", "sap/ui/core/mvc/Controller", "sap/ui/model/Filter", "sap/ui/model/FilterOperator",
	"sap/ui/unified/FileUploaderParameter", "zfin/ap/zapprovebankpayments/model/Messaging", "zfin/ap/zapprovebankpayments/model/formatter"
], function (U, B, F, b, c, M, f) {
	"use strict";
	var _ = M;

	function d(a) {
		var h = a ? a.lastIndexOf(".") : -1;
		return h > 0 ? a.substring(0, h) : "";
	}

	function e(a) {
		var h = a ? a.lastIndexOf(".") : -1;
		return h > 0 ? a.substring(h + 1) : "";
	}

	function g(a, h) {
		var i = d(h);
		var j = e(h);
		return "Draftuuid=guid'" + a + "';Filename='" + i + "';FileExtension='" + j + "';Description=''";
	}
	var C = B.extend("zfin.ap.zapprovebankpayments.controller.detail.batch.Attachments", {
		formatter: f,
		constructor: function () {}
	});
	C.prototype.onBeforeUploadStarts = function (E) {
		var p = E.getParameters();
		var a = this._getBindingContext().getProperty("DraftUUID");
		var o = new U({
			name: "slug",
			value: g(a, p.fileName)
		});
		p.addHeaderParameter(o);
		_.actionStarted(this._getText("uploadAttachment"));
	};
	C.prototype.onAttachmentDeleted = function (E) {
		this._editAttachment(E, "del");
	};
	C.prototype.onAttachmentChange = function (E) {
		var t = this.getOwnerComponent().getModel().getSecurityToken();
		var u = E.getSource();
		var o = new U({
			name: "x-csrf-token",
			value: t
		});
		u.addHeaderParameter(o);
	};
	C.prototype.onAttachmentRenamed = function (E) {
		this._editAttachment(E, "ren");
	};
	C.prototype.onAttachmentsSelectionChange = function (E) {
		var s = E.getSource().getSelectedItems().length > 0;
		this._getViewModel().setProperty("/attachmentSelected", s);
	};
	C.prototype.onAttachmentsUploadComplete = function (E) {
		var a = E.getParameters().files;
		var i;
		for (i = 0; a && i < a.length; i++) {
			if (a[i].status !== 201 && a[i].status !== 0) {
				_.addActionError(a[i]);
			}
		}
		_.actionFinished();
		this._refreshAttachments(this.getView().byId("uploadCollection"));
	};
	C.prototype.onSearchAttachments = function (E) {
		var a = this.getView().byId("uploadCollection");
		var q = E.getParameter("query");
		var o = new F("Filename", b.Contains, q);
		var h = a.getBinding("items");
		h.filter([o]);
	};
	C.prototype._refreshAttachments = function (h) {
		var v = this._getViewModel();
		var m = this.getView().getModel();
		h.setBusy(true);
		var r = function () {
			h.setBusy(false);
			v.setProperty("/attachmentSelected", h.getSelectedItems().length > 0);
		};
		m.invalidateEntry(this._getBindingContext());
		m.read(this._getBindingContext() + "/GetAttachment", {
			success: function (i) {
				var j = i.results;
				j.forEach(function (a) {
					a.DownloadUrl = "/sap/opu/odata/sap/FAP_APPROVEBANKPAYMENTS_SRV/AttachmentDownloadSet(ID='" + a.AttachmId + "')/$value";
				});
				v.setProperty("/attachments", j);
				r();
			},
			error: r
		});
	};
	C.prototype._editAttachment = function (E, a) {
		var s = E.getSource();
		var k = a === "del" ? "deleteAttachment" : "renameAttachment";
		_.actionStarted(this._getText(k));
		this._getBindingContext().getModel().callFunction("/editAttachment", {
			urlParameters: {
				Action: a,
				Filename: d(E.getParameter("fileName")),
				ID: E.getParameter("documentId")
			},
			method: "POST",
			success: function (r) {
				if (!r.Edited) {
					_.addActionError();
				}
				_.actionFinished();
				this._refreshAttachments(s);
			}.bind(this),
			error: function (h) {
				_.addActionError(h);
				_.actionFinished();
				this._refreshAttachments(s);
			}.bind(this)
		});
	};
	C.prototype._getBindingContext = function () {
		return this.getView().getBindingContext();
	};
	C.prototype._getViewModel = function () {
		return this.getView().getModel("batchView");
	};
	C.prototype._getText = function () {
		var i = this.getOwnerComponent().getModel("@i18n").getResourceBundle();
		return i.getText.apply(i, arguments);
	};
	return C;
}, true);