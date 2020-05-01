/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/base/Object", "sap/ui/Global", "sap/ui/model/json/JSONModel"], function (B, U, J) {
	"use strict";
	var c = "zfin.ap.zapprovebankpayments.view.ConfirmUndoDialog";
	return B.extend("zfin.ap.zapprovebankpayments.controller.ConfirmUndoDialog", {
		_resolve: null,
		_reject: null,
		constructor: function (v, a) {
			this._resourceBundle = v.getModel("@i18n").getResourceBundle();
			this._oDialog = U.xmlfragment(v.createId("ConfirmUndoDialog"), c, this);
			v.addDependent(this._oDialog);
			this._oDialog.setModel(new J(this._getModel(a)), "action");
			this._a2 = a; //+@WVF001 Registro seleccionado
			return new Promise(function (r, R) {
				this._resolve = r;
				this._reject = R;
				this._oDialog.open();
			}.bind(this));
		},
		onUndoDialogOkPress: function () {
			this._oDialog.close();
			// BEGIN @WVF Al rechazar cambios, se elimina los apoderados para los lotes seleccionados
			this.onDeleteApoderado();
			// END @WVF			

			this._resolve({
				unprocessOnly: false
			});

		},
		onUndoDialogPartialPress: function () {
			this._oDialog.close();
			this._resolve({
				unprocessOnly: true
			});
		},
		onUndoDialogCancelPress: function () {
			this._oDialog.close();
			this._reject();
		},
		onAfterUndoClose: function () {
			this._oDialog.destroy();
		},
		_getModel: function (a) {
			var i = Array.isArray(a);
			var m = {
				message: this._resourceBundle.getText(i ? "confirmUndoMultiselectBatch" : "confirmUndoBatch"),
				title: this._resourceBundle.getText("confirmUndoChanges"),
				extraUndo: false
			};
			if (i && a.length > 1) {
				m.message = this._resourceBundle.getText("confirmUndoMultiselectBatches", a.length);
			} else {
				this._adjustSingleBatchModel(m, (i ? a[0] : a).getProperty());
			}
			return m;
		},
		_adjustSingleBatchModel: function (m, b) {
			var p = (b.ApprovalIsFirst || b.IsReturnedApproval) && b.PaymentBatchIsEdited;
			if (p && !b.PaymentBatchIsProcessed) {
				m.message = this._resourceBundle.getText("confirmUndoPayments");
			} else if (p && b.PaymentBatchIsProcessed) {
				m.title = this._resourceBundle.getText("confirmKeepOrDiscard");
				m.message = this._resourceBundle.getText("discardOrKeepQuestion");
				m.extraUndo = true;
			}
		},
//BEGIN @WVF001
		onDeleteApoderado: function () {
			var ls_path;
			//Se lee el modelo de apoderados
			var oModelApoderados = this._oDialog.getModel("mApoderados");
			//Diferenciamos el origen del rechazo de cambios
			if (this._a2.length !== undefined) {//Provenientes de la vista Reporte Revisados
			// En Caso se seleccione mas de un registro de lotes, se elimina los aprobadores de cada lote 
				for (var i = 0; i < this._a2.length; i++) {
					//Se genera el path con los campos claves
					ls_path = oModelApoderados.createKey("/APROSELSet", {
						"Lote": this._a2[i].getProperty("PaymentBatch"),
						"Codigosociedad": this._a2[i].getProperty("CompanyCode"),
						"Usuario": ""
					});
					//Se llama al servicio 
					oModelApoderados.remove(ls_path, {
						success: function () {},
						error: function (cc) {}
					});
				}
			} else {//Proveniente de la vista de detalle
				// Se genera el path con los campos claves /APROSELSet(Lote='00002',Codigosociedad='00HE')
				ls_path = oModelApoderados.createKey("/APROSELSet", {
					"Lote": this._a2.getProperty("PaymentBatch"),
					"Codigosociedad": this._a2.getProperty("CompanyCode"),
					"Usuario": ""
				});
				// Se llama al servicio de eliminación con los datos
				oModelApoderados.remove(ls_path, {
					success: function () {},
					error: function (cc) {}
				});
			}
		}
//END @WVF001
	});
});