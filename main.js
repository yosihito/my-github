const date = new Date();
//指定された日時の「年」を取得する
const year = date.getFullYear();
//指定された日時の「月」を取得する。
const month = date.getMonth() + 1;
const adjustmentMonth = `00${month}`.slice(-2);
const today = date.getDate();
const adjustmentToday = `00${today}`.slice(-2);

firebase.auth().onAuthStateChanged((user) => {
	if (user) {
		const userID = user.uid;
		console.log(userID);
		console.log('状態：ログイン中');

		// TDEE計算ツールの処理ここから
		const tdeeCoefficient = {
			'male': { 'aW': 13.397, 'aH': 4.799, 'aA': 5.677, 'b': 88.362 },
			'female': { 'aW': 9.247, 'aH': 3.098, 'aA': 4.33, 'b': 447.593 }
		};
		const tdeeCalculate = function(d) {
			let ce = tdeeCoefficient[d.g];
			let res = {};
			res.base = Math.round(((ce.aW * d.w) + (ce.aH * d.h) - (ce.aA * d.a) + ce.b) * 1) / 1;
			res.tdee = isNaN(res.base) ? 0 : Math.round(res.base * d.wo * 1);
			return res;
		};

		$('.jsTdeeCalculate').on('click', function() {
			// 各設問から値を取得している処理
			let data = {
				'g': $('input[name=tdee_gender]:checked').val(),
				'a': $('input[name=tdee_age]').val(),
				'h': $('input[name=tdee_height]').val(),
				'w': $('input[name=tdee_weight]').val(),
				'wo': $('input[name=tdee_workout]:checked').val(),
			};
			// 関数tdeeCalculateの呼び出し
			let res = tdeeCalculate(data);
			// 計算結果を表示させる処理
			$('.jsTdeeResultBase').text(res.base);
			$('.jsTdeeResultTdee').text(res.tdee);

			//TDEE計算ツールに入力した情報をfirebaseに記録する処理
			const age = $('input[name=tdee_age]').val()
			const height = $('input[name=tdee_height]').val()
			const weight = $('input[name=tdee_weight]').val()
			const basalMetabolism = res.base;
			const tdee = res.tdee;
			firebase.firestore()
			.collection('private').doc(userID)
			.collection(`${year}年${adjustmentMonth}月${adjustmentToday}日`).doc('information')
			.set({
				weight: `${weight}kg`,
				tdee: `${tdee}kcal`,
				basalMetabolism: `${basalMetabolism}kcal`
			}, { merge: true });
		});
		
		//食事内容を記録する処理
		function recordContent(time) {
			$(`.btn_${time}`).on('click', () => {
				const mealContent = $(`.meal_${time}`).text();
				const apiBase1 = 'https://apex.oracle.com/pls/apex/evangelist/shokuhindb/food/';
				const url = apiBase1 + encodeURIComponent(mealContent);

				$.getJSON(url, (data) => {
					if (data.items[0] != undefined) {
						alert('記録されました');
						firebase.firestore()
						.collection('users').doc(userID)
						.collection(`${year}年${adjustmentMonth}月${adjustmentToday}日`).doc(time)
						.collection('content')
						.add({
								name: mealContent,
								kcal: data.items[0].calorie,
							})
							.then(function() {
								firebase.firestore()
								.collection('users').doc(userID)
								.set({
									[`${year}年${adjustmentMonth}月`]: firebase.firestore.FieldValue.arrayUnion(`${adjustmentToday}日`)
									}, { merge: true });
							});
					}
					else if (data.items[0] === undefined) {
						alert('検索できませんでした\n別の品名で検索してください');
					}
					
                    //画像を記録する処理
					const timeUploadImage = (file) => {
						const fileName = `users/${userID}/${time}/${year}年${adjustmentMonth}月${adjustmentToday}日/${mealContent}`;
						firebase
							.storage()
							.ref(fileName)
							.put(file) 
							.then((snapshot) => {
								console.log(snapshot);
								console.log(file);
							})
							.catch((error) => {
								console.error('ファイルアップロードエラー', error);
							});
					};
					// ファイル要素から、選択されたファイルを取得する
					const files = $(`#${time}_file`)[0].files;
					// ファイルが選択されていなかったら
					if (files.length === 0) {
						console.log("ファイルが選択されていません");
						return;
					}
					const file = files[0];
					//stotageにアップロード
					timeUploadImage(file);

				});
			});
		}
		recordContent('breakfast');
		recordContent('lunch');
		recordContent('dinner');
		recordContent('snack');
	}
	else {
		console.log('状態：ログアウト');
	}
	firebase
		.auth()
		.signInAnonymously() // 匿名ログインの実行
		.catch((error) => {
			// ログインに失敗したときの処理
			console.error('ログインエラー', error);
		});
});
$('.btn_calemdar').on('click', () => {
	location.href = 'http://jannebody8.sakura.ne.jp/Monthly.html';
});
