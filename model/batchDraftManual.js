/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["zfin/ap/zapprovebankpayments/model/Messaging"], function (M) {
	"use strict";
	var _ = M;
	var a;

	function b(B, k) {
		var l = B.getProperty("PaymentBatch");
		var u = {
			PaymentBatch: l,
			DraftUUID: B.getProperty("DraftUUID"),
			IsActiveEntity: false
		};
		if (k) {
			u.Token = "'" + k + "'";
		}
		return new Promise(function (r, R) {
			B.getModel().callFunction("/C_AbpPaymentBatchActivation", {
				changeSetId: B.getPath(),
				method: "POST",
				urlParameters: u,
				success: r,
				error: R
			});
		});
	}

	function c(B) {
		var k = B.getPath();
		return new Promise(function (r, R) {
			B.getModel().remove(k, {
				success: r,
				error: R,
				changeSetId: k
			});
		});
	}

	function d(D, B, v) {
		return new Promise(function (r, R) {
			D.update(B, v, {
				changeSetId: B,
				success: function () {
					r({
						path: B
					});
				},
				error: R
			});
		});
	}

	function e(B) {
		var v = {
			PaymentBatchIsProcessed: false,
			PaymentBatchAction: "",
			Note: ""
		};
		return d(B.getModel(), B.getPath(), v);
	}

	function f(B, k) {
		return k.unprocessOnly ? e(B) : c(B);
	}

	function g(B, t) {
		return new Promise(function (r, R) {
			B.getModel().callFunction("/C_AbpPaymentBatchEdit", {
				changeSetId: B.getPath(),
				method: "POST",
				urlParameters: {
					PaymentBatch: B.getProperty("PaymentBatch"),
					DraftUUID: B.getProperty("DraftUUID"),
					IsActiveEntity: true,
					PreserveChanges: !t
				},
				success: r,
				error: R
			});
		});
	}

	function h(D, B, A) {
		var v = {
			PaymentBatchIsProcessed: true,
			PaymentBatchAction: A.action,
			Note: A.note
		};
		if (A.isDefer) {
			v.PaymentBatchDeferDate = A.deferDate;
		}
		return d(D, B, v);
	}

	function i(B, A, r, k) {
		var p = [];
		B.forEach(function (o) {
			p.push(new Promise(function (R, l) {
				var m = o.getProperty("PaymentBatch");
				A(o, k).then(R).catch(function (E) {
					_.addErrorMessage(a.getText(r, m), E);
					l(E);
				});
			}));
		});
		return Promise.all(p);
	}

	function j(B, A, t) {
		if (B.getProperty("IsActiveEntity")) {
			return g(B, t).then(function (D) {
				var p = "/C_AbpPaymentBatch(PaymentBatch='" + D.PaymentBatch + "',DraftUUID=guid'" + D.DraftUUID + "',IsActiveEntity=" + D.IsActiveEntity +
					")";
				return h(B.getModel(), p, A);
			});
		}
		return h(B.getModel(), B.getPath(), A);
	}
	return {
		setResourceBundle: function (B) {
			a = B;
		},
		editBatch: function (B, t) {
			return g(B, t);
		},
		update: function (C, v) {
			var p = C.getPath();
			return new Promise(function (r, R) {
				C.getModel().update(p, v, {
					changeSetId: p,
					success: r,
					error: R
				});
			});
		},
		processBatch: function (B, A, t) {
			return j(B, A, t);
		},
		processBatches: function (B, A, t) {
			return i(B, function (o) {
				return j(o, A, t);
			}, "editBatchFailure");
		},
		submitReviewed: function (B, k) {
			return i(B, b, "submitBatchFailure", k);
		},
		undoBatch: function (B, k) {
			return f(B, k);
		},
		undoBatches: function (B, k) {
			return i(B, f, "undoBatchChagesFailure", k);
		}
	};
});