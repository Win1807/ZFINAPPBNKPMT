/*
 * Copyright (C) 2009-2019 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/model/Filter", "sap/ui/model/json/JSONModel", "zfin/ap/zapprovebankpayments/model/statusGroups"], function (F, J, S) {
	"use strict";
	var _ = {
		viewModelName: "batchListView",
		urgentFilterKeys: "urgentFilterKeys",
		statusFilterKeys: "statusFilterKeys"
	};
	var a = new J({
		firstStageActionsAvailable: false,
		nextStageActionsAvailable: false,
		undoAvailable: false,
		statusFilterKeys: [],
		urgentFilterKeys: [],
		reviewedCount: "0",
		submitReviewedAllowed: false,
		submitReviewedText: ""
	});
	var b = ["ApprovalIsFirst", "ApprovalIsFinal", "IsReturnedApproval", "IsUrgentPayment", "PaymentBatchIsEdited",
		"PaymentBatchIsProcessed", "Status", "PaytBatchHasMoreHouseBanks", "PaytBatchHasMoreBankAccounts", "HouseBank", "HouseBankIBAN"
	].join(",");
	var c = ["ApprovalIsFinal", "ApprovalIsFinalText", "IsUrgentPayment", "PaymentIsUrgentText", "Status"].join(",");
	var d = null;

	function e(f, k) {
		var l;
		var m;
		if (f && k && k.length > 0) {
			m = k.map(function (n) {
				return new F(f, "EQ", n);
			});
			l = m.length === 1 ? m[0] : new F(m, false);
		}
		return l;
	}

	function g() {
		var k;
		var f = [];
		var u = a.getProperty("/" + _.urgentFilterKeys);
		var s = a.getProperty("/" + _.statusFilterKeys);
		if (u && u.length > 0) {
			f.push(e("IsUrgentPayment", u));
		}
		if (s && s.length > 0) {
			k = [].concat.apply([], s.map(function (l) {
				return S.getGroupByKey(l).values;
			}));
			f.push(e("Status", k));
		}
		return f;
	}

	function h(k) {
		var r = k.filter(function (f) {
			return !!f.aFilters;
		})[0];
		return r ? k.indexOf(r) : -1;
	}

	function i() {
		var f = a.getProperty("/reviewedCount");
		var t = d.getText("masterSubmitReviewedCount", f);
		a.setProperty("/submitReviewedText", t);
	}

	function j(s) {
		var f = s.map(function (r) {
			var k = r.getBindingContext();
			return {
				context: k,
				isNew: k.getProperty("ApprovalIsFirst") || k.getProperty("IsReturnedApproval")
			};
		});
		return {
			isSomeFirstStage: f.some(function (k) {
				return k.isNew;
			}),
			isSomeNextStage: f.some(function (k) {
				return !k.isNew;
			}),
			isSomePaymentEdit: f.some(function (k) {
				return k.context.getProperty("PaymentBatchIsEdited");
			}),
			isSomeUntouched: f.some(function (k) {
				return k.context.getProperty("IsActiveEntity");
			})
		};
	}
	return {
		getModel: function () {
			return a;
		},
		getModelName: function () {
			return _.viewModelName;
		},
		getAllwaysRequestFields: function () {
			return b;
		},
		getIgnoredFields: function () {
			return c;
		},
		init: function (f) {
			d = f;
			a.setProperty("/zfirstStageActionsAvailable", false);//+@WVF001
			a.setProperty("/firstStageActionsAvailable", false);
			a.setProperty("/nextStageActionsAvailable", false);
			a.setProperty("/undoAvailable", false);
			a.setProperty("/statusFilterKeys", []);
			a.setProperty("/urgentFilterKeys", []);
			a.setProperty("/reviewedCount", "0");
			a.setProperty("/submitReviewedAllowed", false);
			a.setProperty("/submitReviewedText", d.getText("masterSubmitReviewed"));
		},
		onSelectionChanged: function (s) {
			var f = j(s);
//{+@WVF001 solo se vizualizara el boton rechazar para el estano nuevo y por autorizar
			var isAble = false;
			var lv_status;
			for(var lv_i = 0;lv_i<s.length;lv_i++){
				 lv_status = s[lv_i].getBindingContext().getProperty("Status");
				if( ( lv_status === "IBC01" ) || (lv_status === "IBC02")){
					isAble = true;
			    }else{
			    	isAble = false;
			    	break;
				}		
			} 
			a.setProperty("/zfirstStageActionsAvailable", isAble);
//}+@WVF001		

			a.setProperty("/firstStageActionsAvailable", f.isSomeFirstStage && !f.isSomeNextStage && !f.isSomePaymentEdit);
			a.setProperty("/nextStageActionsAvailable", f.isSomeNextStage && !f.isSomeFirstStage && !f.isSomePaymentEdit);
			a.setProperty("/undoAvailable", s.length > 0 && !f.isSomeUntouched);
		},
		applyCustomFilters: function (B) {
			var f = g();
			var r;
			var k;
			var l;
			for (l = 0; l < f.length; l++) {
				r = h(B.filters);
				k = f[l];
				if (!k.aFilters || r === -1) {
					B.filters.push(k);
				} else if (B.filters[r].bAnd) {
					B.filters[r].aFilters.push(k);
				} else {
					B.filters[r] = new F([B.filters[r], k], true);
				}
			}
		},
		saveCustomState: function (C) {
			var f = function (n) {
				C[n] = a.getProperty("/" + n);
			};
			f(_.urgentFilterKeys);
			f(_.statusFilterKeys);
		},
		restoreCustomState: function (C) {
			var f = function (n) {
				if (C[n] !== undefined) {
					a.setProperty("/" + n, C[n]);
				}
			};
			f(_.urgentFilterKeys);
			f(_.statusFilterKeys);
		},
		getReviewedTabFilters: function () {
			return [new F("IsActiveEntity", "EQ", false), new F("PaymentBatchIsProcessed", "EQ", true)];
		},
		setReviewedCount: function (f) {
			a.setProperty("/reviewedCount", f);
			a.setProperty("/submitReviewedAllowed", f && f !== "0");
			i();
		}
	};
});