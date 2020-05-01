/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/thirdparty/jquery", "sap/ui/base/Object", "sap/ui/Global", "sap/ui/model/json/JSONModel",
		"zfin/ap/zapprovebankpayments/model/formatter",
		'sap/m/MessageBox',
		'sap/ui/model/Filter',
		'sap/ui/model/FilterOperator',
		"sap/m/MessageToast"
	],
	function (q, P, U, J, f, MessageBox, Filter, FilterOperator, MessageToast) {
		"use strict";
		var C = "zfin.ap.zapprovebankpayments.view.batch.ConfirmActionDialog";

		return P.extend("zfin.ap.zapprovebankpayments.controller.detail.batch.ConfirmBatchActionDialog", {
			formatter: f,
			constructor: function (v, a, b, p) {
				var m = new J(a);
				var A = {
					"app": "masterSelectedBatchesApprove",
					"def": "masterSelectedBatchesDefer",
					"rej": "masterSelectedBatchesReject",
					"ret": "masterSelectedBatchesReturn"
				};
				this._oBatchBinding = b;
				this._aPayments = p;
				this._oDeffered = q.Deferred();
				this._oDialog = U.xmlfragment(v.createId("ConfirmActionDialog"), C, this);
				this._oView = v;
				this._sAction = a.action;
				this._sActionText = this.getResourceBundle().getText(A[a.action]);
				this._isRejectWithNote = a.isReject;
				this._oView.addDependent(this._oDialog);
				m.setProperty("/actionEnabled", false);
				this._oDialog.setModel(m, "action");
				this._sShowApoderados = true; //+@WVF001 Muestra los apoderados
				//@wvf001
				// this._oView.byId(
				// 	"zfin.ap.zapprovebankpayments::sap.suite.ui.generic.template.ObjectPage.view.Details::C_AbpPaymentBatch--ConfirmActionDialog--tablewvf"
				// ).setVisible(false);
				this.onConsultarData();
			},
			getPromise: function () {
				var t = this.getResourceBundle().getText("userConfirmDialogBatchTitle", [this._sActionText]);
				this._getActionModel().setProperty("/title", t);
				this.getStatistic();
				this._oDialog.open();
				return this._oDeffered;
			},
			getStatistic: function () {
				var s = new J({
					isMaster: false
				});
				var a = this._oBatchBinding.getProperty("ApprovalIsFirst") || this._oBatchBinding.getProperty("IsReturnedApproval");
				var p = this._oBatchBinding.getProperty("NumberOfPayments");
				var b = a && (!this._aPayments || this._aPayments.length !== p);
				var c;
				this._oDialog.setModel(s, "stats");
				s.setProperty("/mismatchError", false);
				s.setProperty("/reading", b);
				if (b) {
					this._readServerStatistics();
				} else if (!a) {
					s.setProperty("/" + this._sAction, p);
					this._getActionModel().setProperty("/actionEnabled", this._canSubmit());
				} else {
					c = this._aPayments.map(function (d) {
						return d.getBindingContext().getProperty("PaymentAction");
					});
					this._processPaymentsActions(c);
				}
			},
			getResourceBundle: function () {
				return this._oView.getModel("@i18n").getResourceBundle();
			},
			onConfirmDialogOkPress: function () {
				//INIT @wvf001
				var oError = false;
				//Solo si el registro seleccionado iniciará el ciclo de aprobación y solo al precionar el boton aprobar
				if (this.sShowApoderados === true && this._sAction === "app") {
					oError = this.onSaveApoderado();
				} else if (this._sAction === "rej") { //En caso sea un rechazo se eliminara los apoderados elejidos
					this.onDeleteApoderado();
				}

				if (oError === false) {
					//END @wvf001

					var m = this._getActionModel();
					var a = {
						action: this._sAction,
						note: m.getProperty("/note"),
						isDefer: m.getProperty("/isDefer"),
						deferDate: this.formatter.dateTimeToDate(m.getProperty("/deferDate"))
					};
					this._oDeffered.resolve(a);
					this._oDialog.close();

					//INIT @wvf001
				}
				//END @wvf001
			},
			onConfirmDialogCancelPress: function () {
				this._oDeffered.reject();
				this._oDialog.close();
			},
			onAfterClose: function () {
				this._oDialog.destroy();
			},
			handleLiveChange: function (e) {
				var n = e.getParameter("value").length === 0;
				var i = this._getActionModel().getProperty("/isReject");
				if (i) {
					this._setRejWithNote(n);
				}
			},
			_readServerStatistics: function () {
				var p = this._oBatchBinding.getPath();
				var r = {
					success: function (d) {
						var a = d.results.map(function (b) {
							return b.PaymentAction;
						});
						this._processPaymentsActions(a);
					}.bind(this),
					urlParameters: {
						"$select": "PaymentAction"
					}
				};
				this._oBatchBinding.getModel().read(p + "/to_Payment", r);
			},
			_processPaymentsActions: function (a) {
				var s = this._oDialog.getModel("stats");
				a.forEach(function (A) {
					var b = A ? A : this._sAction;
					var Q = s.getProperty("/" + b) || 0;
					s.setProperty("/" + b, Q + 1);
				}, this);
				this._finalizeStatisticsRead();
			},
			_finalizeStatisticsRead: function () {
				var s = this._oDialog.getModel("stats");
				var a = this._getActionModel();
				if (!a.getProperty("/isReject") && s.getProperty("/rej")) {
					a.setProperty("/isReject", true);
					this._setRejWithNote(!a.getProperty("/note"));
				}
				s.setProperty("/reading", false);
				if (!this._setEnableSubmitButton()) {
					s.setProperty("/mismatchError", true);
				}
			},
			_canSubmit: function () {
				return !this._isRejectWithNote;
			},
			_setEnableSubmitButton: function () {
				var a = this._getActionModel();
				var s = this._oDialog.getModel("stats");
				var b = !!s.getProperty("/" + this._sAction);
				a.setProperty("/actionEnabled", b && this._canSubmit());
				return b;
			},
			_setRejWithNote: function (e) {
				this._isRejectWithNote = e;
				this._setEnableSubmitButton();
			},
			_getActionModel: function () {
				return this._oDialog.getModel("action");

			},
			//BEGIN @WVF001
			onManual: function (event) {
				var index = event.getSource().getSelectedIndex();
				var oTable = this._oView.byId(
					"zfin.ap.zapprovebankpayments::sap.suite.ui.generic.template.ObjectPage.view.Details::C_AbpPaymentBatch--ConfirmActionDialog--tablewvf"
				);
				// debugger;
				var oFilter = [new Filter("Importe", "EQ", this._oBatchBinding.getProperty("PaymentBatchAmountInCCCrcy")),
					new Filter("Moneda", "EQ", this._oBatchBinding.getProperty("BankPaymentBatchCurrency")),
					new Filter("Codigosociedad", "EQ", this._oBatchBinding.getProperty("CompanyCode")),
					new Filter("Lote", "EQ", this._oBatchBinding.getProperty("PaymentBatch"))
				];


				if (index === 1) {
					oFilter.push(new Filter("Proceso", "EQ", "MANUAL"));
				} else {
					oFilter.push(new Filter("Proceso", "EQ", "AUTOMATICO"));
					oTable.selectAll();
				}
				oTable.setVisible(true);
				// this._oBatchBinding.getProperty("CompanyCode");
				// this._oBatchBinding.getProperty("BankPaymentBatchCurrency");
				//this._oBatchBinding.getProperty("PaymentBatchAmountInCCCrcy");
				// this._oBatchBinding.getProperty("PaymentBatch");
				// var ls_urls = this._aPayments[0].getBindingContext().sPath;

				var oBindingAp = oTable.getBinding("items");
				oBindingAp.filter(oFilter);

				var oModel = oTable.getModel();
				oTable.setModel(oModel);

				// if (index === 1) {
				// 	var oTable = this._oView.byId(
				// 		"zfin.ap.zapprovebankpayments::sap.suite.ui.generic.template.ObjectPage.view.Details::C_AbpPaymentBatch--ConfirmActionDialog--tablewvf"
				// 	);
				// 	oTable.setVisible(true);
				// 	// this._oBatchBinding.getProperty("CompanyCode");
				// 	// this._oBatchBinding.getProperty("BankPaymentBatchCurrency");
				// 	//this._oBatchBinding.getProperty("PaymentBatchAmountInCCCrcy");
				// 	// this._oBatchBinding.getProperty("PaymentBatch");
				// 	// var ls_urls = this._aPayments[0].getBindingContext().sPath;
				// 	var oFilter = [new Filter("Importe", "EQ", this._oBatchBinding.getProperty("PaymentBatchAmountInCCCrcy")),
				// 		new Filter("Moneda", "EQ", this._oBatchBinding.getProperty("BankPaymentBatchCurrency")),
				// 		new Filter("Codigosociedad", "EQ", this._oBatchBinding.getProperty("CompanyCode")),
				// 		new Filter("Lote", "EQ", this._oBatchBinding.getProperty("PaymentBatch"))
				// 	];
				// 	var oBindingAp = oTable.getBinding("items");
				// 	oBindingAp.filter(oFilter);

				// 	var oModel = oTable.getModel();
				// 	oTable.setModel(oModel);

				// } else {
				// 	this._oView.byId(
				// 		"zfin.ap.zapprovebankpayments::sap.suite.ui.generic.template.ObjectPage.view.Details::C_AbpPaymentBatch--ConfirmActionDialog--tablewvf"
				// 	).setVisible(false);
				// }

			},
			onConsultarData: function () {
				var these = this;
				var oTable = this._oView.byId(
					"zfin.ap.zapprovebankpayments::sap.suite.ui.generic.template.ObjectPage.view.Details::C_AbpPaymentBatch--ConfirmActionDialog--tablewvf"
				);
				var oRButtonGroup = this._oView.byId(
					"zfin.ap.zapprovebankpayments::sap.suite.ui.generic.template.ObjectPage.view.Details::C_AbpPaymentBatch--ConfirmActionDialog--id_rbGroup01"
				);
				var oIndex = oRButtonGroup.getSelectedIndex();
				if (this._sAction === "app") { //La logica solo sera para la aprobación

					var oFilter = [new Filter("Importe", "EQ", this._oBatchBinding.getProperty("PaymentBatchAmountInCCCrcy")),
						new Filter("Moneda", "EQ", this._oBatchBinding.getProperty("BankPaymentBatchCurrency")),
						new Filter("Codigosociedad", "EQ", this._oBatchBinding.getProperty("CompanyCode")),
						new Filter("Lote", "EQ", this._oBatchBinding.getProperty("PaymentBatch"))
					];
					if (oIndex === 1) {
						oFilter.push(new Filter("Proceso", "EQ", "MANUAL"));
					} else {
						oFilter.push(new Filter("Proceso", "EQ", "AUTOMATICO"));
					}
					var oModelApoderados = new sap.ui.model.odata.ODataModel(this._oDialog.getModel("mApoderados").sServiceUrl);
					oModelApoderados.read("/RptAprobadoresSet", {
						filters: oFilter,
						//this.getView().getModel().read("/UserInputSet", oViewModel, {
						success: function (OData, response) {
							// console.log(response.results);
							var sSapMessage = response.headers["sap-message"];
							these.sShowApoderados = true;
							if (sSapMessage !== undefined) {
								var parser = new DOMParser();
								var xmlDoc = parser.parseFromString(sSapMessage, "text/xml");
								var typeMessage = xmlDoc.getElementsByTagName("severity")[0].innerHTML;
								if (typeMessage === "error") {
									oRButtonGroup.setVisible(false);
									these.sShowApoderados = false;
								}
							}
							if ( these.sShowApoderados === true ){
								var oBindingAp = oTable.getBinding("items");
								oBindingAp.filter(oFilter);
							}
							oTable.setVisible(these.sShowApoderados);

						},
						error: function (OData, response) {
							MessageToast.show("Error");
						}

					});
					// oTable.setVisible(false);
				} else { //En otras acciones diferente a la de aprobación dichos conroles se deben de ocultar
					oRButtonGroup.setVisible(false);
					oTable.setVisible(false);
				}

			},
			onSaveApoderado: function () {
				var oEntry = {};
				var oError = false;
				var items;
				var codigo = "";
				var oTable = this._oView.byId(
					"zfin.ap.zapprovebankpayments::sap.suite.ui.generic.template.ObjectPage.view.Details::C_AbpPaymentBatch--ConfirmActionDialog--tablewvf"
				);

				var oModelApoderados = new sap.ui.model.odata.ODataModel(this._oDialog.getModel("mApoderados").sServiceUrl);
				if (oTable.getSelectedItems().length === 1 || oTable.getSelectedItems().length === 2) { //Solo permite elegir dos aprobadores
					items = oTable.getSelectedItems();
					for (var i = 0; i < items.length; i++) {
						var item = items[i].getBindingContext("mApoderados");
						if (codigo === "") {
							codigo = item.getProperty("Codigo");
							oEntry.Codigo = item.getProperty("Codigo");
							oEntry.Grupo = item.getProperty("Grupo");
							oEntry.Cifnif = item.getProperty("Cifnif");
							oEntry.Nombre = item.getProperty("Nombre");
							oEntry.PasosBnkCom = item.getProperty("PasosBnkCom"); //Número de apoderados a legir.
						} else {
							if (codigo !== item.getProperty("Codigo")) {
								//Message error
								MessageBox.error("Los Apoderados seleccionados no corresponden al mismo código");
								oError = true;
								break;
							}
							oEntry.Grupo1 = item.getProperty("Grupo");
							oEntry.Cifnif1 = item.getProperty("Cifnif");
							oEntry.Nombre1 = item.getProperty("Nombre");
						}

					}
					// En caso de tipo de firma Permitira elegir 1 o 2 apoderados  
					//En caso exista registros con solo true para un codigo, se debe elegir 1 apoderado,
					//En caso existan registros con true para un solo codigo, se debe elegir 2 apoderados
					switch (oEntry.PasosBnkCom) {
					case "1":
						if (oEntry.Grupo1 !== undefined) {
							MessageBox.error("Solo debe seleccionar un aprobador del codigo " + oEntry.Codigo);
							oError = true;
						}
						break;
					case "2":
						if (oEntry.Grupo1 === undefined) {
							MessageBox.error("Debe seleccionar dos aprobadores del codigo " + oEntry.Codigo);
							oError = true;
						}
						break;
					}
					oEntry.Lote = this._oBatchBinding.getProperty("PaymentBatch");
					oEntry.Codigosociedad = this._oBatchBinding.getProperty("CompanyCode");
					oEntry.Importe = this._oBatchBinding.getProperty("PaymentBatchAmountInCCCrcy");
					oEntry.Moneda = this._oBatchBinding.getProperty("BankPaymentBatchCurrency");

					if (oError === false) {
						oModelApoderados.create("/RptAprobadoresSet", oEntry, {
							success: function (oData, oResponse) {

								var sSapMessage = oResponse.headers["sap-message"];
								if (sSapMessage !== undefined) {
									var parser = new DOMParser();
									var xmlDoc = parser.parseFromString(sSapMessage, "text/xml");
									var typeMessage = xmlDoc.getElementsByTagName("severity")[0].innerHTML;

									if (typeMessage === "error") {
										oError = true;
										var eMessage = xmlDoc.getElementsByTagName("message")[0].innerHTML;
										sap.m.MessageBox.show(eMessage, {
											icon: sap.m.MessageBox.Icon.ERROR,
											title: "Error",
											actions: [sap.m.MessageBox.Action.OK]
										});
									}
								}
							},

							error: function (oErrorData) {
								// alert("Failure - OData Service could not be called. Please check the Network Tab at Debug.");
								sap.m.MessageBox.show(oErrorData.message, {
									icon: sap.m.MessageBox.Icon.ERROR,
									title: "Error",
									actions: [sap.m.MessageBox.Action.OK]
								});
								oError = true;
							}
						});
					}

				} else {
					//message error
					MessageBox.error("Debe seleccionar uno o dos Apoderados");
					oError = true;
				}

				return oError;
			},
			onDeleteApoderado: function () {
					var ls_path;
					// var items;
					//Se lee el modelo de apoderados
					var oModelApoderados = this._oDialog.getModel("mApoderados");

					//Se genera el path con los campos claves
					ls_path = oModelApoderados.createKey("/APROSELSet", {
						"Lote": this._oBatchBinding.getProperty("PaymentBatch"),
						"Codigosociedad": this._oBatchBinding.getProperty("CompanyCode"),
						"Usuario": this._sAction
					});
					//Se llama al servicio 
					oModelApoderados.remove(ls_path, {
						success: function () {},
						error: function (cc) {}
					});

				}
				//END @WVF001

		});
	});