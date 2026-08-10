export type CampusCoordinate = {
	latitude: number;
	longitude: number;
};

export type CampusSpotType = 'building' | 'outdoor' | 'landmark';

export type CampusSpotSource = 'osm' | 'manual-rough' | 'designer-final';

export type CampusSpot = {
	id: string;
	name: string;
	type: CampusSpotType;
	center: CampusCoordinate;
	boundary: CampusCoordinate[];
	source: CampusSpotSource;
	osmId?: string;
	description: string;
};

const buildingCampusSpots: CampusSpot[] = [
	{
		"id": "building-체육과학관",
		"name": "체육과학관",
		"type": "building",
		"center": {
			"latitude": 36.611175981818,
			"longitude": 127.291436181818
		},
		"boundary": [
			{
				"latitude": 36.6108311,
				"longitude": 127.291429
			},
			{
				"latitude": 36.6111322,
				"longitude": 127.2914722
			},
			{
				"latitude": 36.6111298,
				"longitude": 127.2914984
			},
			{
				"latitude": 36.6111265,
				"longitude": 127.291534
			},
			{
				"latitude": 36.6112341,
				"longitude": 127.2915495
			},
			{
				"latitude": 36.6112376,
				"longitude": 127.2915118
			},
			{
				"latitude": 36.61124,
				"longitude": 127.2914855
			},
			{
				"latitude": 36.6113378,
				"longitude": 127.2914995
			},
			{
				"latitude": 36.611389,
				"longitude": 127.2915068
			},
			{
				"latitude": 36.6114177,
				"longitude": 127.2911956
			},
			{
				"latitude": 36.61086,
				"longitude": 127.2911157
			},
			{
				"latitude": 36.6108311,
				"longitude": 127.291429
			}
		],
		"source": "osm",
		"osmId": "way/235621642",
		"description": "체육과학관 구역입니다."
	},
	{
		"id": "building-행정관",
		"name": "행정관",
		"type": "building",
		"center": {
			"latitude": 36.611173525,
			"longitude": 127.2888758
		},
		"boundary": [
			{
				"latitude": 36.611112,
				"longitude": 127.2892188
			},
			{
				"latitude": 36.6112977,
				"longitude": 127.2891913
			},
			{
				"latitude": 36.6112351,
				"longitude": 127.2885328
			},
			{
				"latitude": 36.6110493,
				"longitude": 127.2885603
			},
			{
				"latitude": 36.611112,
				"longitude": 127.2892188
			}
		],
		"source": "osm",
		"osmId": "way/235622752",
		"description": "행정관 구역입니다."
	},
	{
		"id": "building-약학대학-연구실험동",
		"name": "약학대학 연구실험동",
		"type": "building",
		"center": {
			"latitude": 36.60953928,
			"longitude": 127.28365802
		},
		"boundary": [
			{
				"latitude": 36.6094516,
				"longitude": 127.2833622
			},
			{
				"latitude": 36.6094909,
				"longitude": 127.2837969
			},
			{
				"latitude": 36.6095007,
				"longitude": 127.2839055
			},
			{
				"latitude": 36.6096511,
				"longitude": 127.2838844
			},
			{
				"latitude": 36.6096021,
				"longitude": 127.2833411
			},
			{
				"latitude": 36.6094516,
				"longitude": 127.2833622
			}
		],
		"source": "osm",
		"osmId": "way/434752710",
		"description": "약학대학 연구실험동 구역입니다."
	},
	{
		"id": "building-학술정보원",
		"name": "학술정보원",
		"type": "building",
		"center": {
			"latitude": 36.610068281818,
			"longitude": 127.287120018182
		},
		"boundary": [
			{
				"latitude": 36.6097918,
				"longitude": 127.2866833
			},
			{
				"latitude": 36.6098126,
				"longitude": 127.2869154
			},
			{
				"latitude": 36.6097563,
				"longitude": 127.2869232
			},
			{
				"latitude": 36.6097973,
				"longitude": 127.2873816
			},
			{
				"latitude": 36.6098451,
				"longitude": 127.287375
			},
			{
				"latitude": 36.6098657,
				"longitude": 127.2876048
			},
			{
				"latitude": 36.6100277,
				"longitude": 127.2875823
			},
			{
				"latitude": 36.6100239,
				"longitude": 127.2875399
			},
			{
				"latitude": 36.6100845,
				"longitude": 127.2875315
			},
			{
				"latitude": 36.6100725,
				"longitude": 127.2873979
			},
			{
				"latitude": 36.6102505,
				"longitude": 127.287373
			},
			{
				"latitude": 36.6103241,
				"longitude": 127.2872909
			},
			{
				"latitude": 36.6103168,
				"longitude": 127.287207
			},
			{
				"latitude": 36.6103892,
				"longitude": 127.2871973
			},
			{
				"latitude": 36.6103703,
				"longitude": 127.286978
			},
			{
				"latitude": 36.6102971,
				"longitude": 127.2869878
			},
			{
				"latitude": 36.6102889,
				"longitude": 127.2868926
			},
			{
				"latitude": 36.6102091,
				"longitude": 127.2868383
			},
			{
				"latitude": 36.6100394,
				"longitude": 127.2868619
			},
			{
				"latitude": 36.6100254,
				"longitude": 127.2867045
			},
			{
				"latitude": 36.6099594,
				"longitude": 127.2867136
			},
			{
				"latitude": 36.6099546,
				"longitude": 127.2866606
			},
			{
				"latitude": 36.6097918,
				"longitude": 127.2866833
			}
		],
		"source": "osm",
		"osmId": "way/434752711",
		"description": "학술정보원 구역입니다."
	},
	{
		"id": "building-과학기술2관",
		"name": "과학기술2관",
		"type": "building",
		"center": {
			"latitude": 36.611137138889,
			"longitude": 127.287058727778
		},
		"boundary": [
			{
				"latitude": 36.6113918,
				"longitude": 127.2865698
			},
			{
				"latitude": 36.6109162,
				"longitude": 127.2866331
			},
			{
				"latitude": 36.6109477,
				"longitude": 127.2870004
			},
			{
				"latitude": 36.6109785,
				"longitude": 127.2873595
			},
			{
				"latitude": 36.611027,
				"longitude": 127.2873531
			},
			{
				"latitude": 36.6110313,
				"longitude": 127.2874035
			},
			{
				"latitude": 36.6110597,
				"longitude": 127.2873997
			},
			{
				"latitude": 36.6111026,
				"longitude": 127.287394
			},
			{
				"latitude": 36.6110981,
				"longitude": 127.287341
			},
			{
				"latitude": 36.6111391,
				"longitude": 127.2873356
			},
			{
				"latitude": 36.6111126,
				"longitude": 127.2870255
			},
			{
				"latitude": 36.6111515,
				"longitude": 127.2870204
			},
			{
				"latitude": 36.6111474,
				"longitude": 127.2869725
			},
			{
				"latitude": 36.6111937,
				"longitude": 127.2869664
			},
			{
				"latitude": 36.6111809,
				"longitude": 127.2868173
			},
			{
				"latitude": 36.6112869,
				"longitude": 127.2868032
			},
			{
				"latitude": 36.61129,
				"longitude": 127.2868393
			},
			{
				"latitude": 36.6114135,
				"longitude": 127.2868228
			},
			{
				"latitude": 36.6113918,
				"longitude": 127.2865698
			}
		],
		"source": "osm",
		"osmId": "way/434755631",
		"description": "과학기술2관 구역입니다."
	},
	{
		"id": "building-미래관",
		"name": "미래관",
		"type": "building",
		"center": {
			"latitude": 36.610798475,
			"longitude": 127.285440075
		},
		"boundary": [
			{
				"latitude": 36.6115232,
				"longitude": 127.2856768
			},
			{
				"latitude": 36.6110446,
				"longitude": 127.2857115
			},
			{
				"latitude": 36.6107684,
				"longitude": 127.2854426
			},
			{
				"latitude": 36.6107104,
				"longitude": 127.2848682
			},
			{
				"latitude": 36.6104735,
				"longitude": 127.2848966
			},
			{
				"latitude": 36.610498,
				"longitude": 127.2851455
			},
			{
				"latitude": 36.6104344,
				"longitude": 127.2851554
			},
			{
				"latitude": 36.6104642,
				"longitude": 127.2854527
			},
			{
				"latitude": 36.6105635,
				"longitude": 127.2854372
			},
			{
				"latitude": 36.6105777,
				"longitude": 127.2855785
			},
			{
				"latitude": 36.6109884,
				"longitude": 127.2859778
			},
			{
				"latitude": 36.6115354,
				"longitude": 127.2859381
			},
			{
				"latitude": 36.6115232,
				"longitude": 127.2856768
			}
		],
		"source": "osm",
		"osmId": "way/434755869",
		"description": "미래관 구역입니다."
	},
	{
		"id": "building-진리관",
		"name": "진리관",
		"type": "building",
		"center": {
			"latitude": 36.611213393333,
			"longitude": 127.28454858
		},
		"boundary": [
			{
				"latitude": 36.6115354,
				"longitude": 127.2841759
			},
			{
				"latitude": 36.6113774,
				"longitude": 127.2841987
			},
			{
				"latitude": 36.6113984,
				"longitude": 127.2844238
			},
			{
				"latitude": 36.6110878,
				"longitude": 127.2844687
			},
			{
				"latitude": 36.6110649,
				"longitude": 127.2842236
			},
			{
				"latitude": 36.6108292,
				"longitude": 127.2842578
			},
			{
				"latitude": 36.6108727,
				"longitude": 127.2847236
			},
			{
				"latitude": 36.6110655,
				"longitude": 127.2846956
			},
			{
				"latitude": 36.6111163,
				"longitude": 127.284751
			},
			{
				"latitude": 36.6111766,
				"longitude": 127.2847905
			},
			{
				"latitude": 36.6112274,
				"longitude": 127.2848024
			},
			{
				"latitude": 36.611275,
				"longitude": 127.2847747
			},
			{
				"latitude": 36.6113035,
				"longitude": 127.2847115
			},
			{
				"latitude": 36.6112964,
				"longitude": 127.2846355
			},
			{
				"latitude": 36.6115744,
				"longitude": 127.2845954
			},
			{
				"latitude": 36.6115354,
				"longitude": 127.2841759
			}
		],
		"source": "osm",
		"osmId": "way/434755870",
		"description": "진리관 구역입니다."
	},
	{
		"id": "building-공공정책관",
		"name": "공공정책관",
		"type": "building",
		"center": {
			"latitude": 36.611528441667,
			"longitude": 127.288261708333
		},
		"boundary": [
			{
				"latitude": 36.6113175,
				"longitude": 127.2876608
			},
			{
				"latitude": 36.61138,
				"longitude": 127.2884033
			},
			{
				"latitude": 36.6114853,
				"longitude": 127.2883895
			},
			{
				"latitude": 36.6114933,
				"longitude": 127.2884841
			},
			{
				"latitude": 36.6115645,
				"longitude": 127.2884748
			},
			{
				"latitude": 36.6115841,
				"longitude": 127.288697
			},
			{
				"latitude": 36.6115861,
				"longitude": 127.288784
			},
			{
				"latitude": 36.6117656,
				"longitude": 127.2887686
			},
			{
				"latitude": 36.6117175,
				"longitude": 127.2880847
			},
			{
				"latitude": 36.6115651,
				"longitude": 127.2881046
			},
			{
				"latitude": 36.6115255,
				"longitude": 127.2876335
			},
			{
				"latitude": 36.6113568,
				"longitude": 127.2876556
			},
			{
				"latitude": 36.6113175,
				"longitude": 127.2876608
			}
		],
		"source": "osm",
		"osmId": "way/434756113",
		"description": "공공정책관 구역입니다."
	},
	{
		"id": "building-농심국제관",
		"name": "농심국제관",
		"type": "building",
		"center": {
			"latitude": 36.6090295125,
			"longitude": 127.2856186875
		},
		"boundary": [
			{
				"latitude": 36.609229,
				"longitude": 127.2851412
			},
			{
				"latitude": 36.6089053,
				"longitude": 127.2851896
			},
			{
				"latitude": 36.6089321,
				"longitude": 127.2854677
			},
			{
				"latitude": 36.6088409,
				"longitude": 127.2854813
			},
			{
				"latitude": 36.6088663,
				"longitude": 127.2857452
			},
			{
				"latitude": 36.6090517,
				"longitude": 127.2857175
			},
			{
				"latitude": 36.6090906,
				"longitude": 127.2861207
			},
			{
				"latitude": 36.6093202,
				"longitude": 127.2860863
			},
			{
				"latitude": 36.609229,
				"longitude": 127.2851412
			}
		],
		"source": "osm",
		"osmId": "way/434856620",
		"description": "농심국제관 구역입니다."
	},
	{
		"id": "building-학생회관",
		"name": "학생회관",
		"type": "building",
		"center": {
			"latitude": 36.6105657375,
			"longitude": 127.2896405125
		},
		"boundary": [
			{
				"latitude": 36.6109562,
				"longitude": 127.2893633
			},
			{
				"latitude": 36.6102763,
				"longitude": 127.2894634
			},
			{
				"latitude": 36.6102907,
				"longitude": 127.2896153
			},
			{
				"latitude": 36.6103963,
				"longitude": 127.2895997
			},
			{
				"latitude": 36.6104317,
				"longitude": 127.2899741
			},
			{
				"latitude": 36.6106163,
				"longitude": 127.289947
			},
			{
				"latitude": 36.6105843,
				"longitude": 127.2896093
			},
			{
				"latitude": 36.6109741,
				"longitude": 127.289552
			},
			{
				"latitude": 36.6109562,
				"longitude": 127.2893633
			}
		],
		"source": "osm",
		"osmId": "way/434856622",
		"description": "학생회관 구역입니다."
	},
	{
		"id": "building-석원경상관",
		"name": "석원경상관",
		"type": "building",
		"center": {
			"latitude": 36.611400925,
			"longitude": 127.2897683
		},
		"boundary": [
			{
				"latitude": 36.6111685,
				"longitude": 127.2893915
			},
			{
				"latitude": 36.6112454,
				"longitude": 127.2902022
			},
			{
				"latitude": 36.6116334,
				"longitude": 127.2901451
			},
			{
				"latitude": 36.6115564,
				"longitude": 127.2893344
			},
			{
				"latitude": 36.6111685,
				"longitude": 127.2893915
			}
		],
		"source": "osm",
		"osmId": "way/434856623",
		"description": "석원경상관 구역입니다."
	},
	{
		"id": "building-자유관",
		"name": "자유관",
		"type": "building",
		"center": {
			"latitude": 36.6120788,
			"longitude": 127.284621533333
		},
		"boundary": [
			{
				"latitude": 36.6116528,
				"longitude": 127.2841613
			},
			{
				"latitude": 36.6116698,
				"longitude": 127.2843861
			},
			{
				"latitude": 36.6119209,
				"longitude": 127.2843567
			},
			{
				"latitude": 36.6120632,
				"longitude": 127.2844886
			},
			{
				"latitude": 36.6120822,
				"longitude": 127.2846374
			},
			{
				"latitude": 36.612015,
				"longitude": 127.2846507
			},
			{
				"latitude": 36.6120327,
				"longitude": 127.284906
			},
			{
				"latitude": 36.6120713,
				"longitude": 127.2849096
			},
			{
				"latitude": 36.6122899,
				"longitude": 127.2851953
			},
			{
				"latitude": 36.612381,
				"longitude": 127.2850522
			},
			{
				"latitude": 36.6122419,
				"longitude": 127.2848803
			},
			{
				"latitude": 36.6122153,
				"longitude": 127.2846082
			},
			{
				"latitude": 36.6122707,
				"longitude": 127.2845998
			},
			{
				"latitude": 36.6122485,
				"longitude": 127.2843732
			},
			{
				"latitude": 36.6120268,
				"longitude": 127.2841176
			},
			{
				"latitude": 36.6116528,
				"longitude": 127.2841613
			}
		],
		"source": "osm",
		"osmId": "way/434857481",
		"description": "자유관 구역입니다."
	},
	{
		"id": "building-정의관",
		"name": "정의관",
		"type": "building",
		"center": {
			"latitude": 36.611752976923,
			"longitude": 127.2852099
		},
		"boundary": [
			{
				"latitude": 36.6120073,
				"longitude": 127.2850693
			},
			{
				"latitude": 36.6118256,
				"longitude": 127.2850936
			},
			{
				"latitude": 36.6117931,
				"longitude": 127.2850979
			},
			{
				"latitude": 36.6117666,
				"longitude": 127.2850691
			},
			{
				"latitude": 36.6117335,
				"longitude": 127.2850691
			},
			{
				"latitude": 36.6117004,
				"longitude": 127.2850815
			},
			{
				"latitude": 36.6116905,
				"longitude": 127.2851392
			},
			{
				"latitude": 36.6116348,
				"longitude": 127.2852512
			},
			{
				"latitude": 36.6116299,
				"longitude": 127.285261
			},
			{
				"latitude": 36.6115347,
				"longitude": 127.2854524
			},
			{
				"latitude": 36.6116638,
				"longitude": 127.2855521
			},
			{
				"latitude": 36.6117831,
				"longitude": 127.2853123
			},
			{
				"latitude": 36.6120254,
				"longitude": 127.28528
			},
			{
				"latitude": 36.6120073,
				"longitude": 127.2850693
			}
		],
		"source": "osm",
		"osmId": "way/434857482",
		"description": "정의관 구역입니다."
	},
	{
		"id": "building-과학기술1관",
		"name": "과학기술1관",
		"type": "building",
		"center": {
			"latitude": 36.609965652632,
			"longitude": 127.284613531579
		},
		"boundary": [
			{
				"latitude": 36.6098441,
				"longitude": 127.2838567
			},
			{
				"latitude": 36.6098542,
				"longitude": 127.2839721
			},
			{
				"latitude": 36.6095965,
				"longitude": 127.2840074
			},
			{
				"latitude": 36.6096782,
				"longitude": 127.2849336
			},
			{
				"latitude": 36.6098046,
				"longitude": 127.2849163
			},
			{
				"latitude": 36.6097895,
				"longitude": 127.2847454
			},
			{
				"latitude": 36.6098679,
				"longitude": 127.2847347
			},
			{
				"latitude": 36.6099116,
				"longitude": 127.2847287
			},
			{
				"latitude": 36.6099175,
				"longitude": 127.2847957
			},
			{
				"latitude": 36.6099623,
				"longitude": 127.2847895
			},
			{
				"latitude": 36.6099666,
				"longitude": 127.2848387
			},
			{
				"latitude": 36.6100081,
				"longitude": 127.284833
			},
			{
				"latitude": 36.6100149,
				"longitude": 127.2849088
			},
			{
				"latitude": 36.6102869,
				"longitude": 127.2848711
			},
			{
				"latitude": 36.6102672,
				"longitude": 127.2847987
			},
			{
				"latitude": 36.610229,
				"longitude": 127.2847376
			},
			{
				"latitude": 36.6101844,
				"longitude": 127.2846971
			},
			{
				"latitude": 36.6101187,
				"longitude": 127.2846629
			},
			{
				"latitude": 36.6100452,
				"longitude": 127.2838291
			},
			{
				"latitude": 36.6098441,
				"longitude": 127.2838567
			}
		],
		"source": "osm",
		"osmId": "way/434857746",
		"description": "과학기술1관 구역입니다."
	},
	{
		"id": "building-학군단",
		"name": "학군단",
		"type": "building",
		"center": {
			"latitude": 36.6123665,
			"longitude": 127.2885341
		},
		"boundary": [
			{
				"latitude": 36.6124932,
				"longitude": 127.2885967
			},
			{
				"latitude": 36.6124788,
				"longitude": 127.2884379
			},
			{
				"latitude": 36.6122398,
				"longitude": 127.2884715
			},
			{
				"latitude": 36.6122542,
				"longitude": 127.2886303
			},
			{
				"latitude": 36.6124932,
				"longitude": 127.2885967
			}
		],
		"source": "osm",
		"osmId": "way/473366137",
		"description": "학군단 구역입니다."
	},
	{
		"id": "building-호익프라자",
		"name": "호익프라자",
		"type": "building",
		"center": {
			"latitude": 36.61156475,
			"longitude": 127.287589216667
		},
		"boundary": [
			{
				"latitude": 36.6114674,
				"longitude": 127.2874516
			},
			{
				"latitude": 36.6114771,
				"longitude": 127.2875707
			},
			{
				"latitude": 36.6115601,
				"longitude": 127.2875602
			},
			{
				"latitude": 36.611577,
				"longitude": 127.2877672
			},
			{
				"latitude": 36.6116667,
				"longitude": 127.2877559
			},
			{
				"latitude": 36.6116402,
				"longitude": 127.2874297
			},
			{
				"latitude": 36.6114674,
				"longitude": 127.2874516
			}
		],
		"source": "osm",
		"osmId": "way/522435147",
		"description": "호익프라자 구역입니다."
	},
	{
		"id": "building-가속기ict융합관",
		"name": "가속기ICT융합관",
		"type": "building",
		"center": {
			"latitude": 36.608901116667,
			"longitude": 127.28326685
		},
		"boundary": [
			{
				"latitude": 36.6090629,
				"longitude": 127.282727
			},
			{
				"latitude": 36.6087084,
				"longitude": 127.2827813
			},
			{
				"latitude": 36.6087771,
				"longitude": 127.2834774
			},
			{
				"latitude": 36.6088505,
				"longitude": 127.2834661
			},
			{
				"latitude": 36.6088633,
				"longitude": 127.2835962
			},
			{
				"latitude": 36.6091445,
				"longitude": 127.2835531
			},
			{
				"latitude": 36.6090629,
				"longitude": 127.282727
			}
		],
		"source": "osm",
		"osmId": "way/777025570",
		"description": "가속기ICT융합관 구역입니다."
	},
	{
		"id": "building-산학협력관",
		"name": "산학협력관",
		"type": "building",
		"center": {
			"latitude": 36.609067185714,
			"longitude": 127.284269614286
		},
		"boundary": [
			{
				"latitude": 36.6091862,
				"longitude": 127.2837867
			},
			{
				"latitude": 36.6088464,
				"longitude": 127.28384
			},
			{
				"latitude": 36.6088944,
				"longitude": 127.284315
			},
			{
				"latitude": 36.6090712,
				"longitude": 127.2842873
			},
			{
				"latitude": 36.6090989,
				"longitude": 127.2845617
			},
			{
				"latitude": 36.609112,
				"longitude": 127.2845596
			},
			{
				"latitude": 36.6092612,
				"longitude": 127.284537
			},
			{
				"latitude": 36.6091862,
				"longitude": 127.2837867
			}
		],
		"source": "osm",
		"osmId": "way/777025571",
		"description": "산학협력관 구역입니다."
	},
	{
		"id": "building-문화스포츠관",
		"name": "문화스포츠관",
		"type": "building",
		"center": {
			"latitude": 36.61140111,
			"longitude": 127.29073364
		},
		"boundary": [
			{
				"latitude": 36.6115271,
				"longitude": 127.2904057
			},
			{
				"latitude": 36.6112718,
				"longitude": 127.2904439
			},
			{
				"latitude": 36.6112775,
				"longitude": 127.2905027
			},
			{
				"latitude": 36.6111762,
				"longitude": 127.2905178
			},
			{
				"latitude": 36.6112384,
				"longitude": 127.2911634
			},
			{
				"latitude": 36.611591,
				"longitude": 127.2911107
			},
			{
				"latitude": 36.611574,
				"longitude": 127.2909341
			},
			{
				"latitude": 36.611417,
				"longitude": 127.2909576
			},
			{
				"latitude": 36.6113885,
				"longitude": 127.2906623
			},
			{
				"latitude": 36.6115496,
				"longitude": 127.2906382
			},
			{
				"latitude": 36.6115271,
				"longitude": 127.2904057
			}
		],
		"source": "osm",
		"osmId": "way/856399063",
		"description": "문화스포츠관 구역입니다."
	},
	{
		"id": "building-문화융합관",
		"name": "문화융합관",
		"type": "building",
		"center": {
			"latitude": 36.610539485714,
			"longitude": 127.290165228571
		},
		"boundary": [
			{
				"latitude": 36.610597,
				"longitude": 127.2900545
			},
			{
				"latitude": 36.6105241,
				"longitude": 127.2900665
			},
			{
				"latitude": 36.6105193,
				"longitude": 127.2900213
			},
			{
				"latitude": 36.610427,
				"longitude": 127.2900365
			},
			{
				"latitude": 36.6104674,
				"longitude": 127.2904186
			},
			{
				"latitude": 36.6106326,
				"longitude": 127.2903915
			},
			{
				"latitude": 36.610609,
				"longitude": 127.2901677
			},
			{
				"latitude": 36.610597,
				"longitude": 127.2900545
			}
		],
		"source": "osm",
		"osmId": "way/856399067",
		"description": "문화융합관 구역입니다."
	}
];

const manualCampusSpots: CampusSpot[] = [
	{
		id: 'grass-square',
		name: '잔디광장',
		type: 'outdoor',
		center: { latitude: 36.6099921641862, longitude: 127.28856751856308 },
		boundary: [
			{ latitude: 36.61023054219896, longitude: 127.28781112115603 },
			{ latitude: 36.60962734485682, longitude: 127.28757694542733 },
			{ latitude: 36.60975835487342, longitude: 127.28929598442639 },
			{ latitude: 36.61030131289623, longitude: 127.28928683474028 }
		],
		source: 'manual-rough',
		description: '잔디광장 구역입니다.'
	},
	{
		id: 'central-square',
		name: '중앙광장',
		type: 'outdoor',
		center: { latitude: 36.609906478511476, longitude: 127.28579515464776 },
		boundary: [
			{ latitude: 36.6103943693044, longitude: 127.28620214544192 },
			{ latitude: 36.60950422786748, longitude: 127.28631342612755 },
			{ latitude: 36.60939458099864, longitude: 127.28506393228481 },
			{ latitude: 36.610280242421794, longitude: 127.28494144324866 }
		],
		source: 'manual-rough',
		description: '중앙광장 구역입니다.'
	},
	{
		id: 'green-playground',
		name: '녹지운동장',
		type: 'outdoor',
		center: { latitude: 36.609730065837645, longitude: 127.28230430593948 },
		boundary: [
			{ latitude: 36.60914987686494, longitude: 127.28281356158811 },
			{ latitude: 36.6091291896226, longitude: 127.28203665058953 },
			{ latitude: 36.61024264137942, longitude: 127.28180597434135 },
			{ latitude: 36.61029478671357, longitude: 127.28166644335082 },
			{ latitude: 36.61032659702832, longitude: 127.28155198799816 },
			{ latitude: 36.61039208083301, longitude: 127.2814879544282 },
			{ latitude: 36.61046871654157, longitude: 127.28147146641983 },
			{ latitude: 36.61053857396729, longitude: 127.28146333701727 },
			{ latitude: 36.61060158710793, longitude: 127.28149151025899 },
			{ latitude: 36.61066902007033, longitude: 127.28155602717294 },
			{ latitude: 36.61070262757925, longitude: 127.28163439335448 },
			{ latitude: 36.610718172787415, longitude: 127.28172946048487 },
			{ latitude: 36.61069093404193, longitude: 127.28181598869158 },
			{ latitude: 36.610666007551, longitude: 127.28187737540416 },
			{ latitude: 36.610602782978276, longitude: 127.28193862266775 },
			{ latitude: 36.61055765372101, longitude: 127.28196919705357 },
			{ latitude: 36.6104922820794, longitude: 127.28198572559674 },
			{ latitude: 36.61042243123201, longitude: 127.28199106012852 },
			{ latitude: 36.610390858597334, longitude: 127.28200491726867 },
			{ latitude: 36.61042544743174, longitude: 127.28261981537389 }
		],
		source: 'manual-rough',
		description: '녹지운동장 구역입니다.'
	},
	{
		id: 'tiger-statue',
		name: '호랑이동상',
		type: 'landmark',
		center: { latitude: 36.60927302158275, longitude: 127.28690218505226 },
		boundary: [
			{ latitude: 36.60936797656427, longitude: 127.28676281774406 },
			{ latitude: 36.60937862852543, longitude: 127.28701714583836 },
			{ latitude: 36.60918031926424, longitude: 127.28704156036699 },
			{ latitude: 36.60916290214904, longitude: 127.2867900022458 }
		],
		source: 'manual-rough',
		description: '호랑이동상 구역입니다.'
	},
	{
		id: 'new-main-gate',
		name: '신정문',
		type: 'landmark',
		center: { latitude: 36.608686687909035, longitude: 127.28901254629396 },
		boundary: [
			{ latitude: 36.608641251789855, longitude: 127.28916886059328 },
			{ latitude: 36.60863065182994, longitude: 127.28889497435677 },
			{ latitude: 36.60876140378636, longitude: 127.28885913535862 },
			{ latitude: 36.60875850043087, longitude: 127.2891273829318 }
		],
		source: 'manual-rough',
		description: '신정문 구역입니다.'
	}
];

export const campusSpots: CampusSpot[] = [...buildingCampusSpots, ...manualCampusSpots];

export function getCampusSpotById(id: string) {
	return campusSpots.find((spot) => spot.id === id);
}

export function getCampusSpotPanelPresentation(spot: Pick<CampusSpot, 'name'> | null) {
	return spot
		? { title: `지금, ${spot.name}`, detent: 'expanded' as const }
		: { title: '캠퍼스 구역', detent: 'collapsed' as const };
}

export function isValidCampusSpotBoundary(spot: CampusSpot) {
	return (
		spot.boundary.length >= 4 &&
		spot.boundary.every(
			(coordinate) =>
				Number.isFinite(coordinate.latitude) &&
				Number.isFinite(coordinate.longitude) &&
				coordinate.latitude >= -90 &&
				coordinate.latitude <= 90 &&
				coordinate.longitude >= -180 &&
				coordinate.longitude <= 180
		)
	);
}
