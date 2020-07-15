const weeks = ['日', '月', '火', '水', '木', '金', '土'];
//現在の日時を取得
const date = new Date();
//指定された日時の「年」を取得する
let year = date.getFullYear();
//指定された日時の「月」を取得する。返り値は 0 から始まる 整数値なので１を足してしている
let month = date.getMonth() + 1;
let adjustmentMonth = `00${month}`.slice(-2);

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    const userID = user.uid;
    console.log('状態：ログイン中');

    const config = {
      show: 1,
    };

    //作成したカレンダーを表示させている処理
    function showCalendar(year, month) {
      for (i = 0; i < config.show; i++) {
        const calendarHtml = createCalendar(year, month);
        const sec = document.createElement('section');
        sec.innerHTML = calendarHtml;
        document.querySelector('#calendar').appendChild(sec);
        if (month > 12) {
          year++;
          month = 1;
        }
      }
    }

    //当月のカレンダーを作成している処理
    function createCalendar(year, month) {
      //月の最初の日を取得
      const startDate = new Date(year, month - 1, 1);
      //月の最後の日を取得 0日目は月の１日目の昨日になるので、0日目は前月の月末になる
      const endDate = new Date(year, month, 0);
      //月の末日を整数で取得
      const endDayCount = endDate.getDate();
      //前月の最後の日の情報を取得
      const lasaMonthEndDate = new Date(year, month - 1, 0);
      //前月の末日を整数で取得
      const lastMonththenDayCount = lasaMonthEndDate.getDate();
      //月の最初の日の曜日を整数で取得する 0は日曜日、1は月曜日、2は火曜日、3は水曜日、4は木曜日、5は金曜日、6は土曜日
      const startDay = startDate.getDay();
      let dayCount = 1; //日にちのカウント
      let adjustmentDayCount = `00${dayCount}`.slice(-2);
      let monthlyHtml = ''; //HTMLを組み立てる変数

      //年と月を表示
      monthlyHtml = '<h1>' + year + '年' + month + '月' + '</h1>';
      monthlyHtml += '<table>';
      //曜日の行を作成
      for (let i = 0; i < weeks.length; i++) {
        monthlyHtml += '<td>' + weeks[i] + '</td>';
      }
      // 6週間（6行）あるため、6回ループする
      for (let w = 0; w < 6; w++) {
        monthlyHtml += '<tr>';
        for (let d = 0; d < 7; d++) {
          if (w == 0 && d < startDay) {
            // w = 0 は1週目を表しており、startDayは５なので、それよりもdが少ない時は空のマスが作られる
            //よって 1行目で1日の曜日の��の曜日には空のマスが入る仕組みになっている
            let num = lastMonththenDayCount - startDay + d + 1;
            monthlyHtml += '<td class="disabled">' + num + '</td>';
          }
          else if (dayCount > endDayCount) {
            let num = dayCount - endDayCount;
            // 末尾の日数を超えたら空のマスが作られる
            monthlyHtml += '<td class="disabled">' + num + '</td>';
            dayCount++;
          }
          else {
            //日付の部分
            monthlyHtml += `<td class="day" data-date=${year}年${adjustmentMonth}月${adjustmentDayCount}日>` +
              dayCount + '</td>';
            dayCount++;
            adjustmentDayCount = `00${dayCount}`.slice(-2);
          }
        }
        monthlyHtml += '</tr>';
      }
      monthlyHtml += '</table>';
      return monthlyHtml;
    }

    //firebaseの日付リストとカスタムデータの日付が同じ時、dataクラスを付与する処理
    function data() {
      firebase
        .firestore()
        .collection('users')
        .doc(userID)
        .get().then((doc) => {
          const array = doc.data();
          //オブジェクトの値(配列)を取得
          const key = `${year}年${adjustmentMonth}月`;
          const arrayKey = key.split(',');
          const arrayDate = array[`${year}年${adjustmentMonth}月`];
          arrayDate.forEach(function(value) {
            const result = arrayKey + value;
            const resultArray = result.split(',');
            $('.day').each((index, element) => {
              if ($.inArray($(element).data('date'), resultArray) != -1) {
                $(element).addClass('data')
              }
            });
          });
        });
    }

    //ボタンを押すと月が切り替わる処理の切り替わるの処理をしている部分
    function moveCalendar(e) {
      document.querySelector('#calendar').innerHTML = '';
      if (e.target.id === 'prev') {
        month--;
        adjustmentMonth = `00${month}`.slice(-2);
        if (month < 1) {
          year--;
          month = 12;
          adjustmentMonth = 12;
        }
        //前月 以前に移動した時に 日付リストにある日付にdataクラスを設定する処理
        data();
      }
      if (e.target.id === 'next') {
        month++;
        adjustmentMonth = `00${month}`.slice(-2);
        if (month > 12) {
          year++;
          month = 1;
          adjustmentMonth = '01';
        }
        //次月 以降に移動した時に 日付リストにある日付にdataクラスを設定する処理
        data();
      }
      showCalendar(year, month);

      //前月以前 翌月移行の日付を押すとモーダルが表示される処理
      $(function() {
        $(`.day`).click(function(e) {
          let total = 0;
          $(e.target).hasClass('data');
          if ($(e.target).hasClass('data') === true) {
            $('#modalArea').fadeIn();
            let getDate = $(this).attr('data-date');
            $('.date').append(`<div class="date"><p>${getDate}</p></div>`);
            firebase.firestore()
              .collection('private').doc(userID)
              .collection(getDate).doc('information')
              .get().then((doc) => {
                const info = Object.values(doc.data());
                console.log()
                const basalMetabolism = info[0];
                console.log(basalMetabolism);
                const tdee = info[1];
                const weight = info[2];
                $('.private').append(`<div class="private"><ul>
              <li>基礎代謝&emsp;${basalMetabolism}</li>
              <li>活動代謝&emsp;${tdee}</li>
              <li>体重&emsp;${weight}</li>
              </ul></div>`);
              });

            //記録したデータを表示させる処理
            function showInfo(time, timeZone) {
              const selctor = '.' + time;
              $(selctor).append(`<div class="meal"><p>${timeZone}</p></div>`);
              firebase.firestore()
                .collection('users').doc(userID)
                .collection(getDate).doc(time)
                .collection('content')
                .get().then((data) => {
                  data.forEach(function(doc) {
                    const data = Object.values(doc.data());
                    const cal = `${data[0]}kcal`;
                    const name = data[1];
                    total += data[0];
                    $(selctor).append(`<div class="${time}_record">${name}&emsp;${cal}</div>`);

                    //画像が表示される処理     
                    const fileName = `users/${userID}/${time}/${getDate}/${name}`;
                    firebase
                      .storage()
                      .ref(fileName)
                      .getDownloadURL() // 画像のURLを取得
                      .then((url) => {
                        // URLの取得に成功したときの処理
                        console.log(url);
                        $(selctor).append(`<p><img class='image'src=${url}></p>`);
                      })
                      .catch((error) => {
                        // URLの取得に失敗したときの処理
                        console.error('URL取得エラー', error);
                      });
                  });
                  if (time === 'snack') {
                    $('.total').append(`<div class="total"><p>総摂取カロリー&emsp;${total}kcal</p></div>`);
                  }
                });
            }
            showInfo('breakfast', '朝食');
            //記録したデータを表示させる処理（昼食）
            showInfo('lunch', '昼食');
            //記録したデータを表示させる処理（夕食）
            showInfo('dinner', '夕食');
            //記録したデータを表示させる処理（間食）
            showInfo('snack', '間食');
          }
        });
        $('#closeModal , #modalBg').click(function() {
          $('#modalArea').fadeOut();
          $('.date').empty();
          $('.private').empty();
          $('.breakfast').empty();
          $('.lunch').empty();
          $('.dinner').empty();
          $('.snack').empty();
        });
      });
    }
    //ボタンを押すと前月に切り替わる
    document.querySelector('#prev').addEventListener('click', moveCalendar);
    //ボタンを押すと次月に切り替わる
    document.querySelector('#next').addEventListener('click', moveCalendar);
    //ボタンを押すと前のページへ移動する
    $('#move').on('click', () => {
      location.href = 'http://jannebody8.sakura.ne.jp/index.html';
    });
    data();
    showCalendar(year, month);

    //当月の日付を押したらモーダルが表示される処理
    $(function() {
      $(`.day`).click(function(e) {
        let total = 0;
        $(e.target).hasClass('data');
        if ($(e.target).hasClass('data') === true) {
          $('#modalArea').fadeIn();
          const getDate = $(this).attr('data-date');
          $('.date').append(`<div class="date"><p>${getDate}</p></div>`);
          firebase.firestore()
            .collection('private').doc(userID)
            .collection(getDate).doc('information')
            .get().then((doc) => {
              const info = Object.values(doc.data());
              console.log(info);
              const basalMetabolism = info[0];
              const tdee = info[1];
              const weight = info[2];
              $('.private').append(`<div class="private"><ul>
            <li>基礎代謝&emsp;${basalMetabolism}</li>
            <li>活動代謝&emsp;${tdee}</li>
            <li>体重&emsp;${weight}</li>
            </ul></div>`);
            });

          //記録したデータを表示させる処理
          function showInfo(time, timeZone) {
            const selctor = '.' + time;
            $(selctor).append(`<div class="meal"><p>${timeZone}</p></div>`);
            firebase.firestore()
              .collection('users').doc(userID)
              .collection(getDate).doc(time)
              .collection('content')
              .get().then((data) => {
                data.forEach(function(doc) {
                  const data = Object.values(doc.data());
                  const cal = `${data[0]}kcal`;
                  const name = data[1];
                  total += data[0];
                  $(selctor).append(`<div class="${time}_record">${name}&emsp;${cal}</div>`);

                  //画像が表示される処理     
                  const fileName = `users/${userID}/${time}/${getDate}/${name}`;
                  firebase
                    .storage()
                    .ref(fileName)
                    .getDownloadURL() // 画像のURLを取得
                    .then((url) => {
                      // URLの取得に成功したときの処理
                      console.log(url);
                      $(selctor).append(`<p><img class='image'src=${url}></p>`);
                    })
                    .catch((error) => {
                      // URLの取得に失敗したときの処理
                      console.error('URL取得エラー', error);
                    });
                });
                if (time === 'snack') {
                  $('.total').append(`<div class="total"><p>総摂取カロリー&emsp;${total}kcal</p></div>`);
                }
              });
          }
          showInfo('breakfast', '朝食');
          //記録したデータを表示させる処理（昼食）
          showInfo('lunch', '昼食');
          //記録したデータを表示させる処理（夕食）
          showInfo('dinner', '夕食');
          //記録したデータを表示させる処理（間食）
          showInfo('snack', '間食');
        }
      });
      $('#closeModal , #modalBg').click(function() {
        $('#modalArea').fadeOut();
        $('.date').empty();
        $('.private').empty();
        $('.total').empty();
        $('.breakfast').empty();
        $('.lunch').empty();
        $('.dinner').empty();
        $('.snack').empty();
      });
    });
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