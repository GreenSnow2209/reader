import JSZip from 'jszip';

/**
 * Creates and returns an ArrayBuffer containing a complete, valid EPUB 3 document
 * of the classic book "Hoàng Tử Bé (Le Petit Prince)" in Vietnamese.
 */
export async function createSampleEpub(): Promise<ArrayBuffer> {
  const zip = new JSZip();

  // 1. mimetype (must be first and uncompressed)
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

  // 2. container.xml
  zip.file(
    'META-INF/container.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
  );

  // 3. SVG Cover
  const coverSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 900" width="600" height="900">
  <defs>
    <radialGradient id="skyGrad" cx="50%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#1B2735"/>
      <stop offset="100%" stop-color="#090A0F"/>
    </radialGradient>
    <radialGradient id="planetGrad" cx="40%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#E2B144"/>
      <stop offset="100%" stop-color="#996E1E"/>
    </radialGradient>
  </defs>
  <rect width="600" height="900" fill="url(#skyGrad)"/>
  <!-- Stars -->
  <circle cx="120" cy="150" r="2" fill="#FFFFFF" opacity="0.8"/>
  <circle cx="480" cy="180" r="3" fill="#FFF5BA" opacity="0.9"/>
  <circle cx="250" cy="80" r="1.5" fill="#FFFFFF" opacity="0.7"/>
  <circle cx="390" cy="120" r="2.5" fill="#FFFFFF" opacity="0.8"/>
  <circle cx="80" cy="320" r="2" fill="#FFFFFF" opacity="0.6"/>
  <circle cx="520" cy="380" r="2" fill="#FFFFFF" opacity="0.7"/>
  <!-- Small Planet B-612 -->
  <circle cx="300" cy="620" r="160" fill="url(#planetGrad)"/>
  <!-- Little Prince Silhouette -->
  <path d="M 295 440 L 305 440 L 308 430 Q 300 420 292 430 Z" fill="#F8E71C"/>
  <circle cx="300" cy="415" r="10" fill="#FFE0B2"/>
  <path d="M 292 425 L 308 425 L 312 455 L 318 450 L 310 460 L 305 458 L 304 475 L 296 475 L 295 458 Z" fill="#4A90E2"/>
  <path d="M 308 427 L 340 435 L 338 440 L 308 432 Z" fill="#E24A4A"/>
  <!-- Title Typography -->
  <text x="300" y="240" font-family="'Cinzel', 'Lora', serif" font-size="44" font-weight="bold" fill="#F7D070" text-anchor="middle" letter-spacing="4">HOÀNG TỬ BÉ</text>
  <text x="300" y="285" font-family="'Lora', serif" font-size="20" font-style="italic" fill="#E0E0E0" text-anchor="middle">Le Petit Prince</text>
  <text x="300" y="820" font-family="'Lora', serif" font-size="18" fill="#B0B0B0" text-anchor="middle">ANTOINE DE SAINT-EXUPÉRY</text>
</svg>
`;
  zip.file('OEBPS/images/cover.svg', coverSvg.trim());

  // 4. content.opf
  zip.file(
    'OEBPS/content.opf',
    `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="pub-id">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="pub-id">urn:uuid:lumina-prince-sample-001</dc:identifier>
    <dc:title>Hoàng Tử Bé (Le Petit Prince)</dc:title>
    <dc:creator>Antoine de Saint-Exupéry</dc:creator>
    <dc:language>vi</dc:language>
    <dc:publisher>Lumina Classics Library</dc:publisher>
    <dc:description>Kiệt tác văn học kinh điển về tình yêu thương, sự gắn kết và cái nhìn thuần khiết về thế giới.</dc:description>
    <meta name="cover" content="cover-image"/>
  </metadata>
  <manifest>
    <item id="cover-image" href="images/cover.svg" media-type="image/svg+xml" properties="cover-image"/>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="preface" href="preface.xhtml" media-type="application/xhtml+xml"/>
    <item id="chap1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>
    <item id="chap2" href="chapter2.xhtml" media-type="application/xhtml+xml"/>
    <item id="chap3" href="chapter3.xhtml" media-type="application/xhtml+xml"/>
    <item id="chap4" href="chapter4.xhtml" media-type="application/xhtml+xml"/>
    <item id="chap5" href="chapter5.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine toc="ncx">
    <itemref idref="preface"/>
    <itemref idref="chap1"/>
    <itemref idref="chap2"/>
    <itemref idref="chap3"/>
    <itemref idref="chap4"/>
    <itemref idref="chap5"/>
  </spine>
</package>`
  );

  // 5. toc.ncx
  zip.file(
    'OEBPS/toc.ncx',
    `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <navMap>
    <navPoint id="np-0">
      <navLabel><text>Lời tựa gửi Léon Werth</text></navLabel>
      <content src="preface.xhtml"/>
    </navPoint>
    <navPoint id="np-1">
      <navLabel><text>Chương I: Bức họa trăn nuốt voi</text></navLabel>
      <content src="chapter1.xhtml"/>
    </navPoint>
    <navPoint id="np-2">
      <navLabel><text>Chương II: Hãy vẽ cho tôi một con cừu</text></navLabel>
      <content src="chapter2.xhtml"/>
    </navPoint>
    <navPoint id="np-3">
      <navLabel><text>Chương III: Hành tinh B-612</text></navLabel>
      <content src="chapter3.xhtml"/>
    </navPoint>
    <navPoint id="np-4">
      <navLabel><text>Chương IV: Những cây bao-báp khổng lồ</text></navLabel>
      <content src="chapter4.xhtml"/>
    </navPoint>
    <navPoint id="np-5">
      <navLabel><text>Chương V: Con Cáo và Bí Mật Trái Tim</text></navLabel>
      <content src="chapter5.xhtml"/>
    </navPoint>
  </navMap>
</ncx>`
  );

  // 6. Chapters HTML
  zip.file(
    'OEBPS/preface.xhtml',
    `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="vi">
<head><title>Lời Tựa</title></head>
<body>
  <h1>Gửi Léon Werth</h1>
  <p>Tôi xin các bạn nhỏ tha thứ cho việc tôi đề tặng cuốn sách này cho một người lớn. Tôi có một lý do xác đáng: người lớn này là bạn thân nhất của tôi trên đời. Tôi còn một lý do nữa: người lớn này có thể hiểu mọi chuyện, ngay cả những cuốn sách dành cho trẻ em.</p>
  <p>Người lớn này đang sống ở nước Pháp, nơi anh ấy đang chịu đói rét. Anh ấy rất cần được an ủi. Nếu tất cả những lý do ấy vẫn chưa đủ, tôi xin sẵn sàng đề tặng cuốn sách này cho cậu bé mà người lớn kia trước kia đã từng là.</p>
  <p>Mọi người lớn ban đầu đều là trẻ con cả (nhưng rất ít người trong số họ còn nhớ được điều đó).</p>
  <p style="text-align: right; font-style: italic;">— Antoine de Saint-Exupéry</p>
</body>
</html>`
  );

  zip.file(
    'OEBPS/chapter1.xhtml',
    `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="vi">
<head><title>Chương I</title></head>
<body>
  <h1>Chương I</h1>
  <p>Năm lên sáu tuổi, trong một cuốn sách viết về rừng già nguyên sinh có tựa đề "Những câu chuyện có thật", tôi đã từng nhìn thấy một bức tranh tuyệt đẹp. Bức tranh vẽ một con trăn lớn đang nuốt một con thú dữ.</p>
  <p>Cuốn sách viết: "Những con trăn nuốt chửng cả con mồi mà không cần nhai. Sau đó chúng không thể nhúc nhích được nữa và ngủ suốt sáu tháng để tiêu hóa."</p>
  <p>Lúc đó tôi đã suy nghĩ rất nhiều về những cuộc phiêu lưu nơi rừng rậm, và đến lượt mình, với một chiếc bút chì màu, tôi đã vẽ được bức tranh đầu tiên của đời mình. Đó là bức tranh số 1 của tôi.</p>
  <p>Tôi đem kiệt tác ấy cho những người lớn xem và hỏi họ xem bức tranh có làm họ sợ không. Họ trả lời: "Tại sao một cái mũ lại làm người ta sợ chứ?"</p>
  <p>Bức tranh của tôi không hề vẽ một cái mũ. Nó vẽ một con trăn đang tiêu hóa một con voi. Thế là tôi bèn vẽ thêm phần bên trong bụng con trăn để người lớn có thể hiểu được. Người lớn bao giờ cũng cần phải được giải thích cặn kẽ mọi điều.</p>
</body>
</html>`
  );

  zip.file(
    'OEBPS/chapter2.xhtml',
    `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="vi">
<head><title>Chương II</title></head>
<body>
  <h1>Chương II</h1>
  <p>Tôi đã sống cô đơn như thế, chẳng có ai để thực sự trò chuyện, cho đến một ngày máy bay của tôi bị hỏng giữa sa mạc Sahara cách đây sáu năm. Có một bộ phận trong động cơ bị vỡ. Và vì không có thợ máy hay hành khách nào đi cùng, tôi phải tự mình thực hiện một công việc sửa chữa vô cùng khó khăn. Đối với tôi đó là vấn đề sống còn: tôi chỉ có đủ nước uống trong vòng tám ngày.</p>
  <p>Đêm đầu tiên, tôi ngủ thiếp đi trên cát, cách mọi vùng đất có người ở hàng ngàn dặm. Tôi còn cô độc hơn một người bị đắm tàu lênh đênh trên chiếc bè giữa đại dương bao la.</p>
  <p>Vậy nên bạn có thể hình dung sự ngạc nhiên của tôi khi bình minh thức dậy, có một giọng nói nhỏ nhẹ lạ lùng đánh thức tôi:</p>
  <blockquote>"Làm ơn... hãy vẽ cho tôi một con cừu!"</blockquote>
  <p>Tôi giật bắn mình như vừa bị sét đánh. Tôi dụi mắt và nhìn thật kỹ. Trước mặt tôi là một cậu bé phi thường đang nghiêm trang nhìn tôi chăm chú.</p>
</body>
</html>`
  );

  zip.file(
    'OEBPS/chapter3.xhtml',
    `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="vi">
<head><title>Chương III</title></head>
<body>
  <h1>Chương III</h1>
  <p>Phải mất một thời gian dài tôi mới hiểu cậu từ đâu tới. Hoàng Tử Bé hỏi tôi rất nhiều câu hỏi, nhưng dường như chẳng bao giờ nghe thấy những câu hỏi của tôi. Chỉ qua những lời tình cờ thốt ra mà dần dần mọi bí mật mới hé mở.</p>
  <p>Chẳng hạn khi lần đầu nhìn thấy chiếc máy bay của tôi, cậu hỏi: "Cái vật này là cái gì thế?" — "Đó không phải là một vật. Nó bay được. Đó là một chiếc máy bay. Đó là máy bay của tôi." Và tôi lấy làm tự hào báo cho cậu biết rằng tôi biết bay.</p>
  <p>Lúc đó cậu kêu lên: "Sao cơ! Chú rơi từ trên trời xuống à?"</p>
  <p>"Đúng vậy," tôi khiêm tốn trả lời.</p>
  <p>"Ồ! Buồn cười thật!" Và Hoàng Tử Bé bật cười khanh khách làm tôi bực cả mình. Tôi muốn người ta phải xem trọng những nỗi bất hạnh của mình.</p>
  <p>Rồi cậu nói thêm: "Vậy là chú cũng từ trên trời xuống! Chú thuộc về hành tinh nào thế?"</p>
</body>
</html>`
  );

  zip.file(
    'OEBPS/chapter4.xhtml',
    `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="vi">
<head><title>Chương IV</title></head>
<body>
  <h1>Chương IV</h1>
  <p>Mỗi ngày tôi lại biết thêm một điều gì đó về hành tinh của cậu, về chuyến ra đi, về cuộc hành trình. Điều đó diễn ra thật chậm rãi, qua những suy nghĩ tình cờ. Đến ngày thứ ba, tôi biết đến thảm kịch của loài cây bao-báp.</p>
  <p>Trên hành tinh của Hoàng Tử Bé, cũng như trên mọi hành tinh khác, có những cây cỏ tốt và những loài cỏ có hại. Do đó có những hạt giống tốt và những hạt giống xấu. Nhưng hạt giống thì vô hình. Chúng ngủ yên dưới lòng đất cho đến khi một hạt chợt nảy sinh ý muốn thức giấc.</p>
  <p>Nếu đó là một mầm cây củ cải hay hoa hồng, người ta có thể để nó mọc tùy thích. Nhưng nếu đó là một mầm cây bao-báp có hại, người ta phải nhổ bỏ nó ngay khi nhận ra nó. Đất của hành tinh Hoàng Tử Bé bị nhiễm đầy hạt bao-báp. Mà một cây bao-báp, nếu nhận biết nó quá muộn, người ta sẽ không bao giờ tống khứ được nó đi nữa. Nó sẽ xâm lấn toàn bộ hành tinh. Rễ của nó sẽ đâm thủng hành tinh đó ra từng mảnh.</p>
  <blockquote>"Đó là vấn đề kỷ luật," Hoàng Tử Bé sau này nói với tôi. "Mỗi sáng sau khi làm vệ sinh cho mình xong, bạn phải cẩn thận chăm sóc dọn dẹp cho hành tinh."</blockquote>
</body>
</html>`
  );

  zip.file(
    'OEBPS/chapter5.xhtml',
    `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="vi">
<head><title>Chương V</title></head>
<body>
  <h1>Chương V</h1>
  <p>Và đó là lúc con Cáo xuất hiện.</p>
  <p>"Xin chào," con Cáo nói.</p>
  <p>"Xin chào," Hoàng Tử Bé lịch sự đáp lại rồi quay người lại nhưng chẳng thấy ai cả.</p>
  <p>"Tôi ở đây," giọng nói vang lên, "dưới gốc cây táo..."</p>
  <p>"Bạn là ai thế?" Hoàng Tử Bé hỏi. "Bạn trông xinh đẹp quá..."</p>
  <p>"Tôi là một con Cáo," con Cáo đáp.</p>
  <p>"Lại đây chơi với tôi đi," Hoàng Tử Bé đề nghị. "Tôi đang buồn quá..."</p>
  <p>"Tôi không thể chơi với bạn được," con Cáo nói. "Tôi chưa được cảm hóa."</p>
  <p>"Cảm hóa nghĩa là gì?"</p>
  <p>"Đó là một điều đã bị lãng quên từ lâu," con Cáo giải thích. "Nó có nghĩa là: tạo nên những mối ràng buộc..."</p>
  <p>"Đối với tôi, hiện giờ bạn chỉ là một cậu bé giống như trăm ngàn cậu bé khác. Và tôi không cần bạn. Bạn cũng chẳng cần gì đến tôi. Đối với bạn, tôi chỉ là một con cáo giống như trăm ngàn con cáo khác. Nhưng nếu bạn cảm hóa tôi, chúng ta sẽ cần đến nhau. Đối với tôi, bạn sẽ là duy nhất trên cõi đời này. Đối với bạn, tôi cũng sẽ là duy nhất trên cõi đời..."</p>
  <p>Hoàng Tử Bé bắt đầu hiểu ra. "Có một bông hoa... Tôi nghĩ là nàng đã cảm hóa tôi..."</p>
  <p>Khi chia tay, con Cáo đã tặng cho cậu một bí mật vô giá:</p>
  <blockquote style="font-size: 1.15em; font-weight: bold; color: var(--accent-color);">
    "Đây là bí mật của tôi. Nó rất giản dị thôi: Người ta chỉ nhìn thấy thật rõ ràng bằng trái tim. Những gì cốt lõi nhất đều vô hình trong mắt trần."
  </blockquote>
</body>
</html>`
  );

  return zip.generateAsync({ type: 'arraybuffer' });
}
