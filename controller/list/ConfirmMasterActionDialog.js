/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/base/Object", "sap/ui/Global", "sap/ui/model/json/JSONModel", "zfin/ap/zapprovebankpayments/model/formatter",
		'sap/m/MessageBox',
		'sap/ui/model/Filter',
		'sap/ui/model/FilterOperator',
		"sap/m/MessageToast"
	],
	function (B, U, J, f, MessageBox, Filter, FilterOperator, MessageToast) {
		"use strict";
		var c = "zfin.ap.zapprovebankpayments.view.list.ConfirmActionDialog";
		var _ = f;

		function a(m, r, g) {
			var A = {
				"app": ["masterSelectedBatchesApprove", "Success"],
				"def": ["masterSelectedBatchesDefer", "Warning"],
				"rej": ["masterSelectedBatchesReject", "Error"],
				"ret": ["masterSelectedBatchesReturn", "Warning"]
			};
			var h = A[m.action];
			var t = g.length;
			var i = g.filter(function (j) {
				return j.getProperty("IsActiveEntity") && j.getProperty("HasDraftEntity");
			}).map(function (j) {
				return j.getProperty("DraftAdministrativeData/InProcessByUser");
			});
			var l = i.filter(function (u) {
				return u;
			}).length;
			m.actionTitle = r.getText(h[0]);
			m.actionStatus = h[1];
			m.title = r.getText("userConfirmDialogBatchTitle", [m.actionTitle]);
			m.hasLocked = l > 0;
			m.lockMessage = r.getText("confirmDialogLockMessage", [l, t]);
			m.unsavedCount = i.length - l;
			m.hasUnsaved = m.unsavedCount > 0;
			m.unsavedMessage = r.getText("confirmDialogUnsavedMessage", [m.unsavedCount, t]);
			m.freeCount = t - i.length;
			m.readyCount = m.freeCount;
			m.takeOver = false;
			return new J(m);
		}

		function b(m) {
			var g = m.getProperty("/readyCount") > 0 && (!m.getProperty("/isReject") || !!m.getProperty("/note"));
			if (m.getProperty("/enabled") !== g) {
				m.setProperty("/enabled", g);
			}
		}

		function d(m) {
			var i = m.getProperty("/takeOver");
			var r = m.getProperty("/freeCount") + (i ? m.getProperty("/unsavedCount") : 0);
			m.setProperty("/readyCount", r);
			b(m);
		}
		var e = {
			"/takeOver": d,
			"/note": b
		};
		return B.extend("zfin.ap.zapprovebankpayments.controller.list.ConfirmMasterActionDialog", {
			_resolve: null,
			_reject: null,
			constructor: function (v, m, g) {
				this._viewModel = a(m, v.getModel("@i18n").getResourceBundle(), g);
				b(this._viewModel);
				this._viewModel.attachPropertyChange(null, this._viewModelPropertyChanged, this);
				this._oDialog = U.xmlfragment(v.createId("ConfirmMasterActionDialog"), c, this);
				v.addDependent(this._oDialog);
				this._oDialog.setModel(this._viewModel, "action");
				//INIT @WVF001
				this._sShowApoderados = true; //+@WVF001 Muestra los apoderados
				this._sAction = m.action;
				this.onConsultarData();
				//END @WVF001
				return new Promise(function (r, R) {
					this._resolve = r;
					this._reject = R;
					this._oDialog.open();
				}.bind(this));

			},
			numberOfBatches: function (n) {
				return _.numberOfBatches(n);
			},
			onConfirmMasterDialogOkPress: function () {
				//INIT @wvf001
				// var oEntry = {};
				var oError = false;
				//Solo si el registro seleccionado iniciará el ciclo de aprobación
				if (this.sShowApoderados === true && this._sAction === "app") {
					// var oTable = sap.ui.getCore().byId(
					// 	"zfin.ap.zapprovebankpayments::sap.suite.ui.generic.template.ListReport.view.ListReport::C_AbpPaymentBatch--ConfirmMasterActionDialog--tablewvf"
					// );
					// var items;
					// var codigo = "";
					// // var bCompact = !!this._oView().$().closest(".sapUiSizeCompact").length;
					// var oModelApoderados = new sap.ui.model.odata.ODataModel(this._oDialog.getModel("mApoderados").sServiceUrl);

					// if (oTable.getSelectedItems().length === 1 || oTable.getSelectedItems().length === 2) { //Solo permite elegir dos aprobadores
					// 	items = oTable.getSelectedItems();

					// 	for (var i = 0; i < items.length; i++) {
					// 		var item = items[i].getBindingContext("mApoderados");
					// 		if (codigo === "") {
					// 			codigo = item.getProperty("Codigo");
					// 			oEntry.Codigo = item.getProperty("Codigo");
					// 			oEntry.Grupo = item.getProperty("Grupo");
					// 			oEntry.Cifnif = item.getProperty("Cifnif");
					// 			oEntry.Nombre = item.getProperty("Nombre");
					// 			oEntry.PasosBnkCom = item.getProperty("PasosBnkCom"); //Número de apoderados a legir.
					// 		} else {
					// 			if (codigo !== item.getProperty("Codigo")) {
					// 				//Message error
					// 				MessageBox.error("Los Apoderados seleccionados no corresponden al mismo código");
					// 				oError = true;
					// 				break;
					// 			}
					// 			oEntry.Grupo1 = item.getProperty("Grupo");
					// 			oEntry.Cifnif1 = item.getProperty("Cifnif");
					// 			oEntry.Nombre1 = item.getProperty("Nombre");
					// 		}

					// 	}
					// 	switch (oEntry.PasosBnkCom) {
					// 	case "1":
					// 		if (oEntry.Grupo1 !== undefined) {
					// 			MessageBox.error("Solo debe seleccionar un aprobador del codigo " + oEntry.Codigo);
					// 			oError = true;
					// 		}
					// 		break;
					// 	case "2":
					// 		if (oEntry.Grupo1 === undefined) {
					// 			MessageBox.error("Debe seleccionar dos aprobadores del codigo " + oEntry.Codigo);
					// 			oError = true;
					// 		}
					// 		break;

					// 	}

					// 	var treport = sap.ui.getCore().byId(
					// 		"zfin.ap.zapprovebankpayments::sap.suite.ui.generic.template.ListReport.view.ListReport::C_AbpPaymentBatch--responsiveTable-_tab1_ForReview"
					// 	);
					// 	//Items seleccionados
					// 	items = treport.getSelectedItems();
					// 	//Se lee la data del unico registro seleccionado
					// 	var oProperty = items[0].getBindingContext();

					// 	oEntry.Lote = oProperty.getProperty("PaymentBatch");
					// 	oEntry.Codigosociedad = oProperty.getProperty("CompanyCode");
					// 	oEntry.Importe = oProperty.getProperty("PaymentBatchAmountInCCCrcy");
					// 	oEntry.Moneda = oProperty.getProperty("BankPaymentBatchCurrency");

					// 	if (oError === false) {

					// 		oModelApoderados.create("/RptAprobadoresSet", oEntry, {
					// 			success: function (oData, oResponse) {

					// 				var sSapMessage = oResponse.headers["sap-message"];
					// 				if (sSapMessage !== undefined) {
					// 					var parser = new DOMParser();
					// 					var xmlDoc = parser.parseFromString(sSapMessage, "text/xml");
					// 					var typeMessage = xmlDoc.getElementsByTagName("severity")[0].innerHTML;

					// 					if (typeMessage === "error") {
					// 						oError = true;
					// 						var eMessage = xmlDoc.getElementsByTagName("message")[0].innerHTML;
					// 						sap.m.MessageBox.show(eMessage, {
					// 							icon: sap.m.MessageBox.Icon.ERROR,
					// 							title: "Error",
					// 							actions: [sap.m.MessageBox.Action.OK]
					// 						});
					// 					}
					// 				}

					// 			},

					// 			error: function (oErrorData) {
					// 				// alert("Failure - OData Service could not be called. Please check the Network Tab at Debug.");
					// 				sap.m.MessageBox.show(oErrorData.message, {
					// 					icon: sap.m.MessageBox.Icon.ERROR,
					// 					title: "Error",
					// 					actions: [sap.m.MessageBox.Action.OK]
					// 				});
					// 				oError = true;
					// 			}
					// 		});

					// 	}
					// } else {
					// 	//message error
					// 	MessageBox.error("Debe seleccionar uno ó dos Apoderados");
					// 	oError = true;
					// }
					oError = this.onSaveApoderado();
				} else if (this._sAction === "rej") {
					// En caso de que la opeación sea rechazo se eliminará el apoderado
					this.onDeleteApoderado();
				}
				// En caso de que no exista error alguno proces con la operación
				if (oError === false) {
					//END @wvf001
					var m = this._oDialog.getModel("action");
					var g = {
						action: m.getProperty("/action"),
						note: m.getProperty("/note"),
						isDefer: m.getProperty("/isDefer"),
						deferDate: _.dateTimeToDate(m.getProperty("/deferDate")),
						takeOver: m.getProperty("/takeOver")
					};
					this._oDialog.close();
					this._resolve(g);
				} //+@WVF001
			},
			onConfirmMasterDialogCancelPress: function () {
				this._oDialog.close();
				this._reject();
			},
			onAfterConfirmMasterClose: function () {
				this._viewModel.detachPropertyChange(this._viewModelPropertyChanged, this);
				this._oDialog.destroy();
			},
			_viewModelPropertyChanged: function (E) {
				var p = E.getParameters();
				if (p && p.reason === "binding" && e[p.path]) {
					e[p.path](this._viewModel);
				}
			},
			//BEGIN @WVF001 Metodos adicionales
			onManual: function (event) {
				var index = event.getSource().getSelectedIndex();

				var oTable = sap.ui.getCore().byId(
					"zfin.ap.zapprovebankpayments::sap.suite.ui.generic.template.ListReport.view.ListReport::C_AbpPaymentBatch--ConfirmMasterActionDialog--tablewvf"
				);
				oTable.setVisible(true);
				//Reporte principal
				var treport = sap.ui.getCore().byId(
					"zfin.ap.zapprovebankpayments::sap.suite.ui.generic.template.ListReport.view.ListReport::C_AbpPaymentBatch--responsiveTable-_tab1_ForReview"
				);
				//Items seleccionados
				var items = treport.getSelectedItems();
				//Se lee la data del unico registro seleccionado
				var oProperty = items[0].getBindingContext();
				var oFilter = [new Filter("Importe", "EQ", oProperty.getProperty("PaymentBatchAmountInCCCrcy")),
					new Filter("Moneda", "EQ", oProperty.getProperty("BankPaymentBatchCurrency")),
					new Filter("Codigosociedad", "EQ", oProperty.getProperty("CompanyCode")),
					new Filter("Lote", "EQ", oProperty.getProperty("PaymentBatch"))
				];
				if (index === 1) {
					oFilter.push(new Filter("Proceso", "EQ", "MANUAL"));
				} else {
					oFilter.push(new Filter("Proceso", "EQ", "AUTOMATICO"));
					oTable.selectAll();
				}

				var oBindingAp = oTable.getBinding("items");
				oBindingAp.filter(oFilter);
				// if (index === 1) {
				// 	var oTable = sap.ui.getCore().byId(
				// 		"zfin.ap.zapprovebankpayments::sap.suite.ui.generic.template.ListReport.view.ListReport::C_AbpPaymentBatch--ConfirmMasterActionDialog--tablewvf"
				// 	);
				// 	oTable.setVisible(true);
				// 	//Reporte principal
				// 	var treport = sap.ui.getCore().byId(
				// 		"zfin.ap.zapprovebankpayments::sap.suite.ui.generic.template.ListReport.view.ListReport::C_AbpPaymentBatch--responsiveTable-_tab1_ForReview"
				// 	);
				// 	//Items seleccionados
				// 	var items = treport.getSelectedItems();
				// 	//Se lee la data del unico registro seleccionado
				// 	var oProperty = items[0].getBindingContext();

				// 	var oFilter = [new Filter("Importe", "EQ", oProperty.getProperty("PaymentBatchAmountInCCCrcy")),
				// 		new Filter("Moneda", "EQ", oProperty.getProperty("BankPaymentBatchCurrency")),
				// 		new Filter("Codigosociedad", "EQ", oProperty.getProperty("CompanyCode")),
				// 		new Filter("Lote", "EQ", oProperty.getProperty("PaymentBatch"))
				// 	];

				// 	var oBindingAp = oTable.getBinding("items");
				// 	oBindingAp.filter(oFilter);
				// } else {
				// 	sap.ui.getCore().byId(
				// 		"zfin.ap.zapprovebankpayments::sap.suite.ui.generic.template.ListReport.view.ListReport::C_AbpPaymentBatch--ConfirmMasterActionDialog--tablewvf"
				// 	).setVisible(false);
				// }

			},
			onConsultarData: function () {
				var oFilter = [];
				var these = this;
				var oTable = sap.ui.getCore().byId(
					"zfin.ap.zapprovebankpayments::sap.suite.ui.generic.template.ListReport.view.ListReport::C_AbpPaymentBatch--ConfirmMasterActionDialog--tablewvf"
				);
				var oRButtonGroup = sap.ui.getCore().byId(
					"zfin.ap.zapprovebankpayments::sap.suite.ui.generic.template.ListReport.view.ListReport::C_AbpPaymentBatch--ConfirmMasterActionDialog--id_rbGroup01"
				);
				var oIndex = oRButtonGroup.getSelectedIndex();
				//Reporte principal
				var treport = sap.ui.getCore().byId(
					"zfin.ap.zapprovebankpayments::sap.suite.ui.generic.template.ListReport.view.ListReport::C_AbpPaymentBatch--responsiveTable-_tab1_ForReview"
				);
				// debugger;
				if (this._sAction === "app") { //Solo se ejecutará cuando la acciona sea aprobar
					//Items seleccionados
					var items = treport.getSelectedItems();
					for (var i = 0; i < items.length; i++) {
						var oProperty = items[i].getBindingContext();
						oFilter.push(new Filter("Lote", "EQ", oProperty.getProperty("PaymentBatch")));
						oFilter.push(new Filter("Importe", "EQ", oProperty.getProperty("PaymentBatchAmountInCCCrcy")));
						oFilter.push(new Filter("Moneda", "EQ", oProperty.getProperty("BankPaymentBatchCurrency")));
						oFilter.push(new Filter("Codigosociedad", "EQ", oProperty.getProperty("CompanyCode")));
					}
					oFilter.push(new Filter("Lote", "EQ", "Ap2"));
					if (oIndex === 1) {
						oFilter.push(new Filter("Proceso", "EQ", "MANUAL"));
					} else {
						oFilter.push(new Filter("Proceso", "EQ", "AUTOMATICO"));
						oTable.selectAll();
					}
					var oModelApoderados = new sap.ui.model.odata.ODataModel(this._oDialog.getModel("mApoderados").sServiceUrl);
					oModelApoderados.read("/RptAprobadoresSet", {
						filters: oFilter,
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

									var eMessage = xmlDoc.getElementsByTagName("message")[0].innerHTML;

									if (eMessage === 'OK') {
										// En caso de que los eligos ya estan en otro nivel de aprobación
										these.sShowApoderados = false; //No se mostrarán los controles

									} else {
										// En caso de que los eligidos no tiene el primer nivel de aprobación 
										// se muestran los mensajes y se cierra el popup
										sap.m.MessageBox.show(eMessage, {
											icon: sap.m.MessageBox.Icon.ERROR,
											title: "Error",
											actions: [sap.m.MessageBox.Action.OK]
										});
										these._oDialog.close();
									}
								}

							}

							if (these.sShowApoderados === true) {
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
				} else { //En caso de otras acciones, se olcutan los controles de apoderados
					oTable.setVisible(false);
					oRButtonGroup.setVisible(false);

				}

			},

			onSaveApoderado: function () {
				var oEntry = {};
				var oError = false;
				var oTable = sap.ui.getCore().byId(
					"zfin.ap.zapprovebankpayments::sap.suite.ui.generic.template.ListReport.view.ListReport::C_AbpPaymentBatch--ConfirmMasterActionDialog--tablewvf"
				);
				var items;
				var codigo = "";
				// var bCompact = !!this._oView().$().closest(".sapUiSizeCompact").length;
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
					//Dependiendo del tipo de firma(true or false), se debe selecionar 1 si es true y si hay ambas(true y false) se debe elegir 2 apoderados
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

					var treport = sap.ui.getCore().byId(
						"zfin.ap.zapprovebankpayments::sap.suite.ui.generic.template.ListReport.view.ListReport::C_AbpPaymentBatch--responsiveTable-_tab1_ForReview"
					);
					//Items seleccionados
					items = treport.getSelectedItems();
					//Se lee la data del unico registro seleccionado
					var oProperty = items[0].getBindingContext();

					oEntry.Lote = oProperty.getProperty("PaymentBatch");
					oEntry.Codigosociedad = oProperty.getProperty("CompanyCode");
					oEntry.Importe = oProperty.getProperty("PaymentBatchAmountInCCCrcy");
					oEntry.Moneda = oProperty.getProperty("BankPaymentBatchCurrency");

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
					MessageBox.error("Debe seleccionar uno ó dos Apoderados");
					oError = true;
				}

				return oError;
			},
			onDeleteApoderado: function () {
					var ls_path;
					var items;
					//Se lee el modelo de apoderados
					var oModelApoderados = this._oDialog.getModel("mApoderados");
					var treport = sap.ui.getCore().byId(
						"zfin.ap.zapprovebankpayments::sap.suite.ui.generic.template.ListReport.view.ListReport::C_AbpPaymentBatch--responsiveTable-_tab1_ForReview"
					);
					//Items seleccionados
					items = treport.getSelectedItems();
					// Diferenciamos el origen del rechazo de cambios
					// En Caso se seleccione mas de un registro de lotes, se elimina los aprobadores de cada lote 
					for (var i = 0; i < items.length; i++) {
						//Se genera el path con los campos claves
						ls_path = oModelApoderados.createKey("/APROSELSet", {
							"Lote": items[i].getBindingContext().getProperty("PaymentBatch"),
							"Codigosociedad": items[i].getBindingContext().getProperty("CompanyCode"),
							"Usuario": this._sAction
						});
						//Se llama al servicio 
						oModelApoderados.remove(ls_path, {
							success: function () {},
							error: function (cc) {}
						});
					}

				}
				//END @WVF001
		});
	});