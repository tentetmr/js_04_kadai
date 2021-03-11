// firebase
var firebaseConfig = {
  apiKey: "",
  authDomain: "",
  databaseURL: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};

// Chart.js プラグイン（データラベル追加）
Chart.plugins.register({
  afterDatasetsDraw: function (chart, easing) {
    var ctx = chart.ctx;

    chart.data.datasets.forEach(function (dataset, i) {
      var meta = chart.getDatasetMeta(i);
      if (!meta.hidden) {
        meta.data.forEach(function (element, index) {
          ctx.fillStyle = "#eeeeee";

          var fontSize = 16;
          var fontStyle = "bold";
          var fontFamily = "'Comfortaa', cursive";
          ctx.font = Chart.helpers.fontString(fontSize, fontStyle, fontFamily);

          var dataString = dataset.data[index].toString();

          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          var padding = 5;
          var position = element.tooltipPosition();
          ctx.fillText(
            dataString,
            position.x,
            position.y - fontSize / 2 - padding
          );
        });
      }
    });
  },
});

// firebase初期化
firebase.initializeApp(firebaseConfig);

// firebase Auth
// ログイン時
var provider = new firebase.auth.GoogleAuthProvider();
function signIn() {
  firebase
    .auth()
    .signInWithPopup(provider)
    .then((result) => {
      console.log("ログインしました。");
    })
    .catch((error) => {
      const signinError = `
    サインインエラー
    エラーメッセージ： ${error.message}
    エラーコード: ${error.code}
    `;
      console.log(signinError);
    });
}
// ログアウト時
function signOut() {
  firebase.auth().onAuthStateChanged((user) => {
    firebase
      .auth()
      .signOut()
      .then(() => {
        console.log("ログアウトしました");
        location.reload();
      })
      .catch((error) => {
        console.log(`ログアウト時にエラーが発生しました (${error})`);
      });
  });
}
// ログイン判定
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    const signOutMessage = `
          <p>Hello, ${user.displayName}!<\/p>
          <button class="btn btnPrimary" type="submit"  onClick="signOut()">Logout<\/button>
          `;
    $("#auth").html(signOutMessage);

    console.log("ログインしています");
  } else {
    const signInMessage = `
    <p>Hello, Guest!<\/p>
    <button class="btn btnPrimary" type="submit"  onClick="signIn()">Login<\/button>
            `;
    document.getElementById("auth").innerHTML = signInMessage;
  }
});

// リアルタイム通信
const newPostRef = firebase.database().ref();

// 日付取得用
var now = new Date();

// 読書データ送信
$("#send").on("click", function () {
  newPostRef.push({
    title: $("#title").val(),
    author: $("#author").val(),
    category: $("#category").val(),
    pages: Number($("#pages").val()),
    notes: $("#notes").val(),
    date:
      now.getFullYear() +
      "/" +
      (now.getMonth() + 1) +
      "/" +
      now.getDate() +
      " ",
  });
  $("#title").val(""); //空にする
  $("#author").val(""); //空にする
  $("#category").val(""); //空にする
  $("#pages").val(""); //空にする
  $("#notes").val(""); //空にする
});

// 必須項目入力しない限りSend押せない
$(function () {
  $("#send").prop("disabled", true);
  $("form input:required").change(function () {
    let flag = true;
    $("form input:required").each(function (e) {
      if ($("form input:required").eq(e).val() === "") {
        flag = false;
      }
    });
    if (flag) {
      $("#send").prop("disabled", false);
    } else {
      $("#send").prop("disabled", true);
    }
  });
});

// 読書量初期化
var pageBisuiness = 0;
var pageIT = 0;
var pageNovels = 0;
var pageAcademics = 0;
var pageOthers = 0;

// データ取得、表示
newPostRef.on("child_added", function (data) {
  let v = data.val();
  let k = data.key;
  // 配列作成
  var readingData = [];
  readingData.push({ date: v.date, category: v.category, page: v.pages });
  // テーブルを作成（データの数だけ繰り返し）
  for (var i = 0; i < readingData.length; ++i) {
    var readingDatum = readingData[i];
    $("#tbody").prepend(
      `<tr><td>${readingDatum.date}</td><td>${readingDatum.category}</td><td>${readingDatum.page}<br></td></tr>`
    );
    $("#output").prepend(`
    <div class=outputContent>
    <a>${readingDatum.date}<br>${readingDatum.title} ${readingDatum.author} ${readingDatum.category}<br>${readingDatum.page} pages<br>${readingDatum.impression}<br></a>
    </div>
    `);
  }
  // ページ数更新
  if (readingDatum.category === "Business") {
    pageBisuiness += readingDatum.page;
  } else if (readingDatum.category === "IT") {
    pageIT += readingDatum.page;
  } else if (readingDatum.category === "Novels") {
    pageNovels += readingDatum.page;
  } else if (readingDatum.category === "Academics") {
    pageAcademics += readingDatum.page;
  } else {
    pageOthers += readingDatum.page;
  }
  // グラフ作成
  var ctx = $("#myChart");
  var myBarChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Business", "IT", "Novels", "Academics", "Others"],
      datasets: [
        {
          backgroundColor: [
            "#08655e",
            "#45938b",
            "#bbbbbb",
            "#f3d394",
            "#e9a264",
          ],
          data: [pageBisuiness, pageIT, pageNovels, pageAcademics, pageOthers],
        },
      ],
    },
    options: {
      title: {
        display: true,
        text: "How many pages you read?",
      },
    },
  });
});
