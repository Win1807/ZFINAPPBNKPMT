/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/m/library", "sap/ui/Global", "sap/ui/core/mvc/Controller", "sap/ui/model/json/JSONModel",
	"zfin/ap/zapprovebankpayments/model/formatter"
], function (m, G, B, J, f) {
	"use strict";
	var P = m.PlacementType;
	var _;
	var a;

	function b(h, k) {
		return h.getCustomData().filter(function (c) {
			return c.getKey() === k;
		}).map(function (c) {
			return c.getValue();
		})[0];
	}

	function d(v, i, p, c) {
		var h = "zfin.ap.zapprovebankpayments.view." + p;
		var j = G.xmlfragment(v.createId(i), h, c);
		v.addDependent(j);
		return j;
	}

	function e(s, v, c, A) {
		if (!_) {
			_ = d(v, "approverQuickView", "batch.ApproverQuickView", c);
		}
		_.setModel(A);
		_.setPlacement(P.Auto);
		setTimeout(function () {
			_.openBy(s);
		}, 0);
	}

	function g(s, v, c, A) {
		if (!a) {
			a = d(v, "approversPopover", "batch.ApproversPopover", c);
		}
		a.setModel(A, "approvers");
		a.setPlacement(P.Auto);
		setTimeout(function () {
			a.openBy(s);
		}, 0);
	}
	var C = B.extend("zfin.ap.zapprovebankpayments.controller.detail.batch.Timeline", {
		formatter: f,
		constructor: function () {}
	});
	C.prototype.onExit = function () {
		[_, a].forEach(function (i) {
			if (i) {
				i.destroy();
			}
		});
		_ = undefined;
		a = undefined;
	};
	C.prototype._getApproverModelFromTimeline = function (k) {
		var c = this.getOwnerComponent().getModel("batchView");
		return c.getProperty("/timeline").filter(function (h) {
			return h.Action === k.Action && h.Changed === k.Changed && h.Usnam === k.Usnam;
		}).map(function (h) {
			return new J({
				FullName: h.NameText,
				Telephone: h.TelnrLong,
				Mobile: h.MobileLong,
				Email: h.SmtpAddr,
				CompanyName: h.Name1,
				CompanyAddress: h.ApproverAddress
			});
		})[0];
	};
	C.prototype.onTimelineUsernamePress = function (E) {
		var s = E.getSource();
		var k = {
			Action: b(s, "Action"),
			Changed: b(s, "Changed"),
			Usnam: b(s, "Usnam")
		};
		var c = this._getApproverModelFromTimeline(k);
		if (c) {
			e(s, this.getView(), this, c);
		}
	};
	C.prototype.onApproverPress = function (E) {
		var s = E.getSource();
		var c = b(s, "Details");
		var h = b(s, "Approvers");
		if (c) {
			e(s, this.getView(), this, new J(c));
		} else if (h) {
			g(s, this.getView(), this, new J(h));
		}
	};
	return C;
}, true);