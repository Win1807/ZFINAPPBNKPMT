/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["zfin/ap/zapprovebankpayments/model/batchDraft", "zfin/ap/zapprovebankpayments/model/Messaging", "sap/ui/model/Filter",
	"sap/ui/model/FilterOperator", "zfin/ap/zapprovebankpayments/controller/detail/DialogFactory"
], function (B, M, F, a, D) {
	"use strict";
	var _ = B;
	var b = D;
	var c = M;
	var d;
	var e;

	function f(z) {
		c.publishEvent(c.eventName.BATCH_ACTION, {
			id: z
		});
	}

	function g(C) {
		return C.getProperty("HasDraftEntity") === true && !C.getProperty("DraftAdministrativeData/InProcessByUser");
	}

	function h(V) {
		var z = {
			userName: V.getBindingContext().getProperty("DraftAdministrativeData/LastChangedByUserDescription")
		};
		return b.askTakeOver(V, z);
	}

	function i(A, z, V, C) {
		var E = b.getDeferSettings();
		return b.askConfirmBatchAction(V, {
			action: A,
			isDefer: A === "def",
			isReject: A === "rej",
			deferDate: E.date,
			deferMinDate: E.minDate,
			note: ""
		}, z, C);
	}

	function j(z) {
		if (z) {
			c.addActionError(z);
			c.actionFinished();
		}
	}

	function k(z, A, C, E) {
		var G = Object.assign({
			replaceInHistory: true
		}, E);
		var H = z.getNavigationController();
		var I = A.createBindingContext(C, function (J) {
			H.navigateInternal(J, G);
		});
		if (I) {
			H.navigateInternal(I, G);
		}
	}

	function l(z, A, C) {
		var E = {
			navigationProperty: "to_Payment"
		};
		k(z, A, C, E);
	}

	function m(z, A, C) {
		return new Promise(function (R) {
			var E = e.createId("Payments::responsiveTable");
			if (E.indexOf("C_AbpPaymentBatch") === -1) {
				E = E.replace("C_AbpPayment", "C_AbpPaymentBatch");
			}
			var G = sap.ui.getCore().byId(E);
			G.attachEventOnce("updateFinished", function (H) {
				H.getSource().attachEventOnce("updateFinished", function () {
					R();
				});
			});
			k(z, A, C);
		});
	}

	function n(z, A, C) {
		return "/" + z.createKey(A, C);
	}

	function o(z, P, A) {
		var C = {
			PaymentBatch: P,
			DraftUUID: A,
			IsActiveEntity: false
		};
		return n(z.getModel(), "C_AbpPaymentBatch", C);
	}

	function p(z, P, A, C) {
		var E = {
			PaymentBatch: P,
			PaymentBatchItem: A,
			DraftUUID: C,
			IsActiveEntity: false
		};
		return n(z.getModel(), "C_AbpPayment", E);
	}
	var q = function (z, A, P, C) {
		return new Promise(function (R, E) {
			var G = new F({
				path: "PaymentBatchItem",
				operator: a.EQ,
				value1: P.getObject().PaymentBatchItem
			});
			P.getModel().read(C + "/to_Payment", {
				filters: [G],
				success: R
			});
		});
	};
	var r = function (z, A, P, C) {
		var E = C.results[0];
		var G = p(z, E.PaymentBatch, E.PaymentBatchItem, E.DraftUUID, false);
		return m(A, z.getModel(), P).then(l.bind(null, A, z.getModel(), G));
	};
	var s = function (z, A, P, C) {
		var E = o(z, C.PaymentBatch, C.DraftUUID, false);
		if (P) {
			return q(z, A, P, E).then(r.bind(null, z, A, E));
		} else {
			return m(A, z.getModel(), E);
		}
	};
	var t = function (z, A, T, P) {
		return new Promise(function (R, C) {
			var E = z.batchContext;
			_.editBatch(E, T).then(s.bind(null, E, A, P)).then(function () {
				f(E.getProperty("PaymentBatch"));
				c.actionFinished(d.getText("editBatchSuccess", E.getProperty("PaymentBatch")));
				R();
			}).catch(C);
		});
	};
	var u = function (z, A, T, P) {
		return new Promise(function (R, C) {
			c.actionStarted(d.getText("editBatchAction"));
			return A.securedExecution(t.bind(null, z, A, T, P));
		});
	};
	var v = function (z, A, V, C, T) {
		var E = z.getProperty("PaymentBatch");
		var G = !z.getProperty("IsActiveEntity");
		return new Promise(function (R, H) {
			c.actionStarted(d.getText("editBatchAction"));
			C.securedExecution(_.processBatch.bind(null, z, A, T)).then(function (I) {
				c.actionFinished(d.getText("editBatchSuccess", E));
				if (G) {
					z.getModel().refresh();
				} else {
					m(C, z.getModel(), I.path);
				}
				f(E);
				R();
			}).catch(H);
		});
	};
	var w = function (z, A, V, C) {
		return v(z, A, V, C, true).catch(j);
	};
	var x = function (z, A, V, C) {
		return v(z, A, V, C, false).catch(function (E) {
			if (_.isUnsavedChangesError(E)) {
				h(V).then(function () {
					return w(z, A, V, C);
				}).catch(j);
			} else {
				j(E);
			}
		});
	};
	var y = function (z, A) {
		return new Promise(function (R, C) {
			z.invalidateEntry(A);
			z.read(A, {
				success: R,
				error: C
			});
		});
	};
	return {
		setResourceBundle: function (R) {
			d = R;
			_.setResourceBundle(R);
		},
		setView: function (V) {
			e = V;
		},
		editableBatch: function (z, V, A, P) {
			e = V;
			if (g(z.batchContext)) {
				return h(V).then(function (C) {
					return u(z, A, true, P);
				}).catch(j);
			} else {
				return u(z, A, false, P).catch(function (E) {
					if (_.isUnsavedChangesError(E)) {
						h(V).then(function () {
							return u(z, A, true, P);
						}).catch(j);
					} else {
						j(E);
					}
				});
			}
		},
		processBatch: function (z, V, A) {
			if (g(z.batchContext)) {
				h(V).then(function () {
					return i(z.action, z.batchContext, V, z.items);
				}).then(function (C) {
					return w(z.batchContext, C, V, A);
				}).catch(j);
			} else {
				i(z.action, z.batchContext, V, z.items).then(function (C) {
					return x(z.batchContext, C, V, A);
				});
			}
		},
		undoBatchWithMessages: function (z, V, A) {
			var C = z.getProperty("PaymentBatch");
			b.askConfirmUndo(V, z).then(function (E) {
				c.actionStarted(d.getText("masterSelectedBatchesUndo"));
				A.securedExecution(_.undoBatch.bind(null, z, E)).then(function () {
					var G;
					if (!E.unprocessOnly) {
						c.actionFinished(d.getText("undoBatchChagesSuccess", C));
						G = "/" + z.getModel().createKey("C_AbpPaymentBatch", {
							PaymentBatch: C,
							DraftUUID: "00000000-0000-0000-0000-000000000000",
							IsActiveEntity: true
						});
						m(A, z.getModel(), G).then(function () {
							f(C);
						});
					} else {
						c.actionFinished(d.getText("undoBatchMoveSuccess", C));
						var H = V.getElementBinding();
						z.getModel().invalidateEntry(z);
						H.refresh();
						f(C);
					}
				}).catch(j);
			}).catch(j);
		},
		update: function (P, z, A, C) {
			c.actionStarted(d.getText("editPaymentAction"));
			return C.securedExecution(function () {
				var E = P.map(function (G) {
					return _.update(G, A);
				});
				if (!z.getProperty("PaymentBatchIsEdited")) {
					E.push(_.update(z, {
						PaymentBatchIsEdited: true
					}));
				}
				return Promise.all(E);
			}).then(function () {
				var E = z.getPath();
				var G = P[0].getModel();
				return new Promise(function (R, H) {
					var I = [];
					I.push(y(G, E));
					I.concat(P.map(function (J) {
						return y(G, J.getPath());
					}));
					Promise.all(I).then(function (J) {
						var K = {
							text: P.length > 1 ? "editPaymentsSuccess" : "editPaymentSuccess",
							param: P.length > 1 ? P.length : P[0].getProperty("PaymentDocument")
						};
						c.actionFinished(d.getText(K.text, K.param));
						R(J[0]);
					});
				});
			}).catch(j);
		},
		updateWithBatchMessages: function (C, z) {
			var A = C.getProperty("PaymentBatch");
			c.actionStarted(d.getText("editBatchAction"));
			return _.update(C, z).then(function () {
				c.actionFinished(d.getText("editBatchSuccess", A));
				return z;
			}).catch(j);
		}
	};
});