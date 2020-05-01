/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/base/Log", "sap/ui/core/library", "sap/m/Button", "sap/m/Dialog", "sap/m/MessageBox", "sap/m/MessageItem",
	"sap/m/MessageToast", "sap/m/MessageView", "sap/ui/core/message/Message"
], function (L, c, B, D, M, a, b, d, e) {
	"use strict";
	var f = c.MessageType;
	var _ = sap.ui.getCore().getEventBus();
	var g = "zfin.ap.zapprovebankpayments";
	var h = "onBatchActionExecutedEvent";
	var i = "onPaymentTableEdited";
	var j = "onPaymentEdited";
	var k;
	var l;
	var m;
	var n;

	function o() {
		return sap.ui.getCore().getMessageManager();
	}

	function p() {
		return o().getMessageModel();
	}

	function q(T, P) {
		var C = typeof T === "object" && T.hasOwnProperty(P) ? T[P] : null;
		return C ? C : null;
	}

	function r(E) {
		var C = null;
		var F = q(E, "responseText");
		var G = null;
		if (F) {
			try {
				G = JSON.parse(F);
				C = G.error;
			} catch (H) {
				C = null;
			}
		}
		return C;
	}

	function s(E) {
		var C = r(E);
		return C && C.message ? C.message.value : null;
	}

	function t(E) {
		return q(E, "message");
	}

	function u(E) {
		var C;
		var F = [s, t, function (H) {
			return H;
		}];
		var G;
		for (G = 0; G < F.length; G++) {
			C = F[G](E);
			if (C) {
				break;
			}
		}
		return C;
	}

	function v(E) {
		var C;
		if (E && E.message) {
			C = E.message + (E.response ? "\r\n" + E.response.body : "");
		} else {
			C = E;
		}
		return C;
	}

	function w(C) {
		b.show(C);
	}

	function x() {
		var C = p().getData()[0];
		M.error(C.message, {
			details: C.description
		});
	}

	function y() {
		if (!l) {
			l = new d({
				items: {
					path: "/",
					template: new a({
						type: "{type}",
						title: "{message}",
						description: "{description}"
					})
				}
			});
			l.setModel(p());
		}
		return l;
	}

	function z() {
		if (!m) {
			m = new D({
				resizable: true,
				content: y(),
				state: "Error",
				beginButton: new B({
					press: function () {
						this.getParent().close();
					},
					text: k.getText("dialogClose")
				}),
				contentHeight: "300px",
				contentWidth: "500px",
				verticalScrolling: false
			});
		}
		y().navigateBack();
		return m;
	}

	function A(C) {
		var E = z();
		E.setTitle(C);
		E.open();
	}
	return {
		eventName: {
			BATCH_ACTION: h,
			PAYMENT_CHANGE: j,
			PAYMENT_TABLE_CHANGE: i
		},
		setReourceBundle: function (C) {
			k = C;
		},
		actionStarted: function (C) {
			n = C;
			o().removeAllMessages();
		},
		addActionError: function (C) {
			this.addErrorMessage(k.getText("operationFailed", n), C);
		},
		actionFinished: function (C) {
			var E = p().getData().length;
			if (E > 1) {
				A(n);
			} else if (E === 1) {
				x();
			} else if (C) {
				w(C);
			}
		},
		showSuccessMessage: function (C) {
			w(C);
		},
		addErrorMessage: function (C, E) {
			this.logError(C, E);
			o().addMessages(new e({
				type: f.Error,
				message: C,
				description: u(E),
				processor: p()
			}));
		},
		logError: function (C, E, F) {
			var G = C ? C : E;
			var H = C ? v(E) : undefined;
			L.error(G, H, F);
		},
		getBusinessLogicErrorCode: function (E) {
			var C = r(E);
			return C ? C.code : null;
		},
		isMessageCentrumError: function (E) {
			return !!this.getBusinessLogicErrorCode(E);
		},
		publishEvent: function (C, E) {
			_.publish(g, C, E);
		},
		subscribeEvent: function (C, H, E) {
			_.subscribe(g, C, H, E);
		},
		unsubscribeEvent: function (C, H, E) {
			_.unsubscribe(g, C, H, E);
		}
	};
});