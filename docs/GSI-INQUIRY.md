# GSI inquiry: public distribution of N03-derived map data

Status: preliminary inquiry submitted through GSI's form on 2026-09-26;
GSI displayed its successful-send confirmation. Awaiting a response; approval
has not been obtained. The public repository contains the source release
described in [PUBLISHING.md](PUBLISHING.md); generated map files remain local.

## Where and how to ask

Use [GSI's application/approval inquiry form](https://geoinfo2.gsi.go.jp/contact/Inquiry2.aspx?bcode=100602&mcode=10060202&pcode=1006),
linked under **４．問い合わせ窓口** on
[GSI's official map-use procedures page](https://www.gsi.go.jp/LAW/2930-index.html).
The responsible office is 国土地理院 地理空間情報部 情報企画課 審査係
(Geospatial Information Department, Information Planning Division, Review Section).

Use the draft below for a preliminary classification inquiry. It asks about
downloadable files and downstream redistribution, as well as the website.
Fill in the sender fields privately; personal contact details do not belong
in this repository. The draft does not itself apply for approval.

Select **ご質問** (question), enter your email in both email fields, enter your
name and phone number, confirm the required topic selections, and paste the
short inquiry below into **内容** (message). Selecting **ご質問** reloads the form and makes
name and phone number required, although they initially appear optional.
The message must fit 1,024 characters, including line breaks; the limit is
checked on submission rather than shown beside the input. Press **送信** to
reach the review screen, verify the details, then press **ＯＫ** to send.
The form sends an acknowledgement email after a successful submission.

If GSI confirms an application is required, use **測量成果ワンストップサービス**
(Survey Results One-Stop Service), linked from the same official page. GSI
distinguishes Article 29 reproduction approval and Article 30 use approval;
ask it to identify the appropriate route. Its
[application guide](https://www.gsi.go.jp/LAW/2930-30zyou.html) requests applicant
identity/address, source product and approval number, geographic scope,
processing, purpose, and work period. It also asks how readily the original
survey data could be reconstructed from a GIS/data product. Describe our
transformations honestly and obtain GSI's assessment rather than claiming
that simplification automatically meets that condition.

After approval, follow the required credit/approval-number wording and
[product-submission instructions](https://www.gsi.go.jp/LAW/2930-seika.html).
Those accept screenshots for software and URLs for public web maps. Preserve
the answer, approval number, scope, and conditions before changing publication
exclusions. Keep private correspondence outside Git unless redacted for release.

## Short inquiry submitted

This is the submitted message text, within the form's 1,024-character limit.
Sender contact details were supplied separately in the form and are omitted here.

件名：国土数値情報N03加工データのGitHub公開に必要な手続

国土地理院 審査係 御中
日本語の地名の読み方を学ぶWebアプリ「Nihongo Navigator」を開発しています。国土数値情報の行政区域データ（2024年1月1日時点）全国版N03-20240101_GML.zip及び群馬県版N03-20240101_10_GML.zipを使用しています。配布元にはCC BY 4.0及び複製承認「R 5JHf 357」の表示があります。

行政区域ポリゴンを統合・簡略化して座標付きベクトルタイル（PMTiles）に変換し、代表点・表示範囲・地名の読み等を含むJSONも作成します。原データの復元可能性について、必要な加工条件も確認したく存じます。

加工したタイル・JSONをGitHubでダウンロード・fork・変更・再配布可能な形で公開し、将来Web地図でも表示したいと考えています。現在はプログラムと再構築用スクリプト等のみ公開し、原データ・加工地図・地図画像は非公開です。コードはMITですが、地図データは原典及び承認の条件に従う方針です。

以下をご教示ください。
1. 第29条の複製承認、第30条の使用承認、申請不要のどれに該当しますか。抽出可能なタイル・JSONの公開は認められますか。
2. 第三者によるfork・変更・再配布・Web表示や商用利用にも個別申請が必要ですか。
3. GitHub配布とWeb表示を一つの申請で扱えますか。汎用地図データベースとしての申請・継続報告が必要ですか。
4. 出典・承認番号の表示場所、成果品提出、更新時の手続を教えてください。再現性のため固定した2024年版で申請可能ですか。

処理内容と詳細な質問は下記に記載しています。必要な資料・サンプル等もご案内ください。
https://github.com/noodlefrenzy/nihongo-navigator/blob/main/docs/GSI-INQUIRY.md
よろしくお願いいたします。

## Detailed Japanese inquiry

The full draft below provides additional context linked from the submitted message.

件名：国土数値情報（行政区域データ・2024年版）の加工データをGitHubで公開する場合の承認手続について

国土地理院 地理空間情報部 情報企画課 審査係 御中

日本語の地名の読み方を学習するWebアプリ「Nihongo Navigator（Chizu）」を開発しています。
国土数値情報の行政区域データを加工した成果品の公開について、必要な手続を確認したく、ご相談いたします。

対象の原典は、国土交通省「国土数値情報（行政区域データ）」2024年1月1日時点の全国版
（N03-20240101_GML.zip）および群馬県版（N03-20240101_10_GML.zip）です。
配布ページには、CC BY 4.0の表示と「測量法に基づく国土地理院長承認（複製）R 5JHf 357」の表示があります。
https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-2024.html

現在はローカル環境で試作・検証しており、下記リポジトリではプログラム、再構築用スクリプト等のみを公開しています。
N03の原データ、加工した地図データ、地図画像は公開対象から除外しています。
https://github.com/noodlefrenzy/nihongo-navigator

公開を希望する成果品の内容は次のとおりです。

1. 全国の行政区域ポリゴンを地域・都道府県・市区町村等の単位で統合・簡略化し、
   地理座標を持つベクトルタイル（PMTiles形式）に変換します。
2. ポリゴン内部の代表点や表示範囲を計算し、地名、読み仮名、行政コード等と合わせたJSONデータ、
   および地名表示用のポイントタイルを作成します。名称・読み仮名には総務省等の別資料も使用します。
3. 学習者が地名を選択し、読み方を回答するWeb地図で使用します。
   測量や境界確定を目的とするものではありませんが、成果品には位置座標が含まれます。
4. 加工後のタイル・JSONを公開GitHubリポジトリに収録し、第三者がダウンロード、fork、変更、再配布できる形を希望しています。
   将来、同じデータを読み込むWebアプリの一般公開も検討しています。
5. プログラムはMITライセンスです。地図データをMITへ変更する意図はなく、原典の利用条件、
   出典表示および貴院の承認条件を守る方針です。MITのプログラムは第三者が商用利用することも可能なため、
   加工データについても商用・非商用の下流利用に適用される条件を確認したいと考えています。

以下についてご教示いただけますでしょうか。

- この配布・表示方法は、測量法第29条の複製承認、第30条の使用承認、または申請不要のいずれに該当しますか。
- 加工後のベクトルタイル・JSONを、抽出可能なファイルとして公開することは認められますか。
  原測量成果の復元可能性等について、必要な加工や条件があればご教示ください。
- 承認を得た成果品を第三者がfork・変更・再配布・Web表示する場合、第三者にも個別申請が必要ですか。
  商用利用を含めて条件を確認するには、申請書にどのように記載すればよいですか。
- GitHubでのファイル配布とWebアプリでの表示を、一つの申請で扱えますか。
  また、汎用地図データベースとしての申請や継続的な報告が必要になりますか。
- 必要な出典・承認番号の表示場所、成果品の提出方法、将来のデータ更新時の手続を教えてください。
- 再現性のため2024年版を固定して使用していますが、この版での申請は可能ですか。
  審査に必要な資料（処理手順、サンプルファイル、画面例等）もご案内いただけますと幸いです。

公開可能な範囲と手続を確認したうえで、加工データの配布を進めたいと考えています。
よろしくお願いいたします。

氏名：［送信時に記入］
連絡先メールアドレス：［送信時に記入］

## English explanation

The draft identifies the exact N03 sources and explains our polygon merging,
simplification, tiling, derived label points, and Japanese reading overlays.
It states that generated maps are currently withheld from the source release.
It requests a classification and explicit conditions for downloadable PMTiles
and JSON, public web display, forks, modifications, and downstream commercial
use. It also asks about reconstruction restrictions, whether one application
covers both distribution methods, possible database reporting, required credits,
updates, and the fixed 2024 source version.

Before sending, supply your sender name, email address, and phone number privately
and review the proposed downstream-use scope. Include the repository link;
provide samples or screenshots privately to GSI only if requested and appropriate.
The formal application will need additional identity/address details and a
work schedule. No formal application has been submitted. Private contact
details and submission records remain in ignored local files.
