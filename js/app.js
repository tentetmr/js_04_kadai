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

// Define a plugin to provide data labels
Chart.plugins.register({
  afterDatasetsDraw: function (chart, easing) {
    // To only draw at the end of animation, check for easing === 1
    var ctx = chart.ctx;

    chart.data.datasets.forEach(function (dataset, i) {
      var meta = chart.getDatasetMeta(i);
      if (!meta.hidden) {
        meta.data.forEach(function (element, index) {
          // Draw the text in black, with the specified font
          ctx.fillStyle = "#eeeeee";

          var fontSize = 16;
          var fontStyle = "bold";
          var fontFamily = "'Comfortaa', cursive";
          ctx.font = Chart.helpers.fontString(fontSize, fontStyle, fontFamily);

          // Just naively convert to string for now
          var dataString = dataset.data[index].toString();

          // Make sure alignment settings are correct
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

firebase.initializeApp(firebaseConfig);

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
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    const signOutMessage = `
          <p>Hello, ${user.displayName}!<\/p>
          <button class="btn btn-primary" type="submit"  onClick="signOut()">Logout<\/button>
          `;
    $("#auth").html(signOutMessage);
    console.log("ログインしています");
  } else {
    const signInMessage = `
    <p>Hello, Guest!<\/p>
    <button class="btn btn-primary" type="submit"  onClick="signIn()">Login<\/button>
            `;
    document.getElementById("auth").innerHTML = signInMessage;
  }
});
const newPostRef = firebase.database().ref();

var now = new Date();

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

var pageBiz = 0;
var pageIT = 0;
var pageNov = 0;
var pageAca = 0;
var pageOther = 0;

newPostRef.on("child_added", function (data) {
  let v = data.val();
  // let k = data.key;

  // グラフ用の配列作成
  var readingData = [];

  readingData.push({ date: v.date, category: v.category, page: v.pages });



  // テーブルを作成（データの数だけ繰り返し）
  for (var i = 0; i < readingData.length; ++i) {
    var readingDatum = readingData[i];
    $("#tbody").prepend(
      `<tr><td>${readingDatum.date}</td><td>${readingDatum.category}</td><td>${readingDatum.page}<br></td></tr>`
    );
    $("#output").prepend(`
    <div class=outputContent><a>${readingDatum.date}<br>${readingDatum.title} ${readingDatum.author} ${readingDatum.category}<br>${readingDatum.page} pages<br>${readingDatum.impression}</a></div>
    `
      );
    
  }
  // let readingTotal = 0;
  // let readingArray = [];
  // if (readingDatum.category === "Business") {
  //   for (var i = 0; i < readingData.length; ++i) {
  //     readingTotal += Number(readingDatum.page);
  //     readingArray.concat(readingTotal);

  //   }
  //   console.log(readingArray);
  // }

  if (readingDatum.category === "Business") {
    pageBiz += readingDatum.page;
  } else if (readingDatum.category === "IT") {
    pageIT += readingDatum.page;
  } else if (readingDatum.category === "Novels") {
    pageNov += readingDatum.page;
  } else if (readingDatum.category === "Academics") {
    pageAca += readingDatum.page;
  } //その他
  else {
    pageOther += readingDatum.page;
  }
  console.log(pageOther);

  var ctx = $("#myChart");
  if (myBarChart) {
    myBarChart.destroy();
  }

  var myBarChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Business", "IT", "Novels", "Academics", "Others"], //v.categoryに登録したカテゴリーを並べたい
      datasets: [
        {
          backgroundColor: [
            "#08655e",
            "#45938b",
            "#bbbbbb",
            "#f3d394",
            "#e9a264",
          ],
          data: [pageBiz, pageIT, pageNov, pageAca, pageOther], //カテゴリ別の集計データを置きたい
        },
      ],
    },
    options: {
      title: {
        display: true,
        //グラフタイトル
        text: "Category",
      },
    },
  });
});
