"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { VideoPlayer } from "@/components/ui/VideoPlayer";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Tv from "lucide-react/dist/esm/icons/tv";
import Search from "lucide-react/dist/esm/icons/search";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import X from "lucide-react/dist/esm/icons/x";
import Monitor from "lucide-react/dist/esm/icons/monitor";
import Zap from "lucide-react/dist/esm/icons/zap";
import Shield from "lucide-react/dist/esm/icons/shield";
import Server from "lucide-react/dist/esm/icons/server";
import CheckCircle from "lucide-react/dist/esm/icons/check-circle-2";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";
import Link from "next/link";

interface M3uEntry {
  name: string;
  url: string;
  originalUrl: string;
  logo: string | null;
  group: string | null;
}

interface ServerInfo {
  label: string;
  url: string;
  status: "idle" | "loading" | "ok" | "error";
  count: number;
}

const SERVER_URLS: string[] = [
  "http://omerta-pro.com:80/get.php?username=0422635871&password=d05a9d4b21e6&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=05bd292723&password=orl31p01pl&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=061a86247e&password=ffff810563c7&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=069e9c84d0&password=8b02b808e4f2&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=08db0f5083&password=1c61ac6dedf6&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=0c1f92b1c9&password=e85604c9a31e&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=0da5c02df5&password=0f47a7d7df&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=0e376faace&password=7e9f63747ffd&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=0e3e611622bd&password=ec4ed7803aaf&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=119985ffbd&password=44449d2ce4ed&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=13de3339c4&password=e495daeface5&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=1569818b04&password=50aec67baa&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=18593b4158&password=82ebc9b0eca1&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=190492996f&password=e1510e6ac83e&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=1ae2db0d94&password=f15b667ceb37&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=1bbfbf8c6f&password=17c406a1f1ae&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=1d8aaedd09&password=96b08fae0dd1&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=1ddf16fae2&password=fb1ac6874ad7&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=1fad7673b1&password=c5c6457335e4&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=1nfzxq7vqp&password=lnedu66eqq&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=20415dada8&password=9ee5f3a921&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=22c06934fc&password=d7b364da652a&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=232dc7e7f2&password=987b37712f7a&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=2534033244&password=f5uakk397a&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=2a32131489&password=a229734d72b8&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=2a9fce3511&password=a9ecd0894cf3&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=2c0daa29e1&password=dc00b799276e&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=2f0ab7c32f&password=f5e2f8cbdae7&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=32a9845ad5&password=64127c1912f2&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=341f50ce8e&password=76666377d6dd&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=37333fd199&password=144c21991781&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=3a2cba0476&password=1e9086caa8&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=3e7d97dd0f&password=a6624afa65be&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=4098ed2cf4&password=e1f5ca0675&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=40c710a5e1&password=5595a2beee30&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=41c71b1601&password=59359ecf750d&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=4299805f7f&password=045310756ba8&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=4b3d0f1829&password=cd0294a5f6d5&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=4c65afd1e1&password=47c857f4e58f&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=4cfe920f52&password=a3cbed680b7c&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=4d84a5a8a8&password=827079e7aacd&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=4e6443533e&password=7520571312bf&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=4xojv5pkx0&password=cacb6c11ae92&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=54d73a234f&password=jlzlxbcltt&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=562aca0ca9&password=9d37a4c809c4&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=5b39ebc76c&password=98d077d50b01&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=5b75ae16e9&password=85e8f17616b3&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=5d283ff331&password=a0d7f1b56835&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=6104f27e28&password=186fa0a4da9f&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=61c6809130&password=7b2e56654d&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=63b9b21ce4ad3&password=69f0b36daa&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=641e2ae814&password=77faca967c6b&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=64d123b229a59&password=c370c1c843&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=650736e08b9e5&password=bf9b3b3673&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=6544afd5d5&password=n9wjg5kkxa&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=661e12c78a&password=5cce93c8d2f0&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=665e0c6b68adf&password=1b7352aab3&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=6665cbbaa8&password=c89825745b71&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=67164bd274&password=7147143128dd&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=67332cc25de37&password=5f5873c57e&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=6787fdb8a3&password=a5c3ffdf7cf1&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=67921150517a9&password=9cae812992&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=67af726bd2022&password=72f011fa23&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=68674d6b99&password=a69bd3a0ba99&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=68ee210a1d&password=zukovic&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=6997437497511&password=96037c6653&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=699b61209b&password=c67291b69455&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=6d8c5d861e&password=665220b3cc4e&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=6fd271f9b2&password=0678c1351e26&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=704ae5f42a&password=7323e685d825&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=70fc282686&password=f9097354bd8b&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=7164844146&password=202a21701482&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=729d6c77cd&password=82f0e3ad1c&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=7535186f0b&password=david318c3ac8a0&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=76fc2ac678&password=124a0f56628b&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=7b2c05686a&password=e7c3327d6510&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=7d39758331&password=d6edc66f5935&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=7wl5yingnp&password=5p65j8yk9l&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=8001ac32290f&password=6f827a0c99c5&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=846da3d092&password=1e48343935&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=849ac36031&password=ef5289f39fa8&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=87be509e77&password=3eab34c74d6c&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=8a0ff58803&password=f93cc46a1da5&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=8f629e7398&password=0a95be41bac6&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=93bc10403f&password=18a61ca75c4a&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=943ff4e380&password=5cafbf676717&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=988a7fce70&password=f1b0d91cb30b&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=99821c5627&password=b80544c6ec6e&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=a25b91f1aa&password=4a684e84bb8e&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=a6c1559054&password=bfc1dd43d01d&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=a962f9436d&password=16de438307fa&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=ac7d3b8a19&password=5c7efb80a1ce&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=ad338ec1b5&password=3b3229a2fb74&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=ad59472dd4&password=062dbb1038df&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=ae979c1be5&password=df426ee79e0b&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=af60ffe4c0&password=c7320bccc6c1&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=b0wy2izi1r&password=22700b675bf0&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=b30940d80c&password=3bc1d10fd4a2&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=b3301af697&password=f363be61637d&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=b39fab07d3&password=87f21c293819&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=b4aff583f5&password=df4dc28a227e&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=b5a5ddd58ca7&password=390db25bc112&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=bb5bd31494&password=acce56b72176&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=bdc0c40d43&password=dafdf6bfa473&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=c2f54e1afc&password=1af5e6a675&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=c385f3e88f&password=ef2363b4d83f&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=c46f890173&password=07d44d45dbec&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=ca864dae82&password=8d1bd2662113&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=cab7943b7f&password=70c30b0a2c7c&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=cc1d647918&password=28f3d7c9fb2d&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=cd10e2e437&password=f1cc09d8e7e5&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=ceaa74ff52&password=94c8c718144d&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=d30fcd04d7&password=15c6cd4296d0&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=d459ef8eac&password=7aa71555a757&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=d557d7eaccf5&password=efcebd8a255f&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=d7c3ec6702&password=e2a9fbfc7691&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=d8ad2a8dac&password=fc54f1a5d019&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=d93e94b3bd&password=b043d0034634&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=d9fe31208b&password=067215f031e7&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=dc2f93a45f&password=ff1892797ca9&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=e315404437&password=33f736r3i2&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=e4096cee7204&password=1dba2c452c8c&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=e40eedd634&password=bbcd299fcbdc&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=e4b9408561&password=983928d1ce12&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=e75cc54170&password=f82a3083c4d2&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=e826707f98&password=fec02df5b4d9&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=ec3e672860&password=d106f032f4&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=eexs4hmyzl&password=090ab45b68bf&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=eff0606222&password=7c212dd5008d&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=f1cec6af94&password=9a7c3256dfdf&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=f2460aa362&password=1e6ca9faed&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=f55379e921&password=312bfef9397a&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=f607fff316&password=ap9qk4pkl6&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=f615c94568&password=69ebed86acd0&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=f74ac62ce4&password=ee620c2e071e&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=f8daae4752&password=ba6ca13beae0&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=f9bdd4ce7b&password=7a61cfbe7ff3&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=f9f008e2b2&password=c1498bd75a90&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=fc678bb5dc&password=4454f65a00f5&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=fe5869ec1f&password=aa343fad795f&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=ff82bfb932&password=8607291452f2&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=fU34zQhV2afR&password=Y7wgBcKU4VDn&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=gjbqb3wem5&password=c8e7c522b4&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=ik8m04zzkd&password=u2hx40rmqs&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=ojf63tzm56&password=49l8y3ddew&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=qv2d58qpdp&password=rou5t1f62r&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=r476u9j3l1&password=7yolkyncby&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=tzd9bgmpd8&password=fd607v18xt&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=We1uf0gJYGXT&password=6Kq0gbnaY7dX&type=m3u_plus",
  "http://omerta-pro.com:80/get.php?username=x1wz9z2sn9&password=qpp6ipt8v5&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=0422635871&password=d05a9d4b21e6&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=05bd292723&password=orl31p01pl&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=061a86247e&password=ffff810563c7&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=069e9c84d0&password=8b02b808e4f2&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=08db0f5083&password=1c61ac6dedf6&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=0c1f92b1c9&password=e85604c9a31e&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=0da5c02df5&password=0f47a7d7df&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=0e376faace&password=7e9f63747ffd&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=0e3e611622bd&password=ec4ed7803aaf&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=119985ffbd&password=44449d2ce4ed&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=13de3339c4&password=e495daeface5&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=1569818b04&password=50aec67baa&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=18593b4158&password=82ebc9b0eca1&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=190492996f&password=e1510e6ac83e&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=1ae2db0d94&password=f15b667ceb37&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=1bbfbf8c6f&password=17c406a1f1ae&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=1d8aaedd09&password=96b08fae0dd1&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=1ddf16fae2&password=fb1ac6874ad7&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=1fad7673b1&password=c5c6457335e4&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=1nfzxq7vqp&password=lnedu66eqq&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=20415dada8&password=9ee5f3a921&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=22c06934fc&password=d7b364da652a&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=232dc7e7f2&password=987b37712f7a&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=2534033244&password=f5uakk397a&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=2a32131489&password=a229734d72b8&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=2a9fce3511&password=a9ecd0894cf3&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=2c0daa29e1&password=dc00b799276e&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=2f0ab7c32f&password=f5e2f8cbdae7&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=32a9845ad5&password=64127c1912f2&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=341f50ce8e&password=76666377d6dd&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=37333fd199&password=144c21991781&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=3a2cba0476&password=1e9086caa8&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=3e7d97dd0f&password=a6624afa65be&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=4098ed2cf4&password=e1f5ca0675&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=40c710a5e1&password=5595a2beee30&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=41c71b1601&password=59359ecf750d&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=4299805f7f&password=045310756ba8&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=4b3d0f1829&password=cd0294a5f6d5&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=4c65afd1e1&password=47c857f4e58f&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=4cfe920f52&password=a3cbed680b7c&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=4d84a5a8a8&password=827079e7aacd&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=4e6443533e&password=7520571312bf&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=4xojv5pkx0&password=cacb6c11ae92&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=54d73a234f&password=jlzlxbcltt&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=562aca0ca9&password=9d37a4c809c4&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=5b39ebc76c&password=98d077d50b01&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=5b75ae16e9&password=85e8f17616b3&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=5d283ff331&password=a0d7f1b56835&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=6104f27e28&password=186fa0a4da9f&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=61c6809130&password=7b2e56654d&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=63b9b21ce4ad3&password=69f0b36daa&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=641e2ae814&password=77faca967c6b&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=64d123b229a59&password=c370c1c843&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=650736e08b9e5&password=bf9b3b3673&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=6544afd5d5&password=n9wjg5kkxa&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=661e12c78a&password=5cce93c8d2f0&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=665e0c6b68adf&password=1b7352aab3&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=6665cbbaa8&password=c89825745b71&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=67164bd274&password=7147143128dd&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=67332cc25de37&password=5f5873c57e&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=6787fdb8a3&password=a5c3ffdf7cf1&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=67921150517a9&password=9cae812992&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=67af726bd2022&password=72f011fa23&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=68674d6b99&password=a69bd3a0ba99&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=68ee210a1d&password=zukovic&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=6997437497511&password=96037c6653&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=699b61209b&password=c67291b69455&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=6d8c5d861e&password=665220b3cc4e&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=6fd271f9b2&password=0678c1351e26&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=704ae5f42a&password=7323e685d825&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=70fc282686&password=f9097354bd8b&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=7164844146&password=202a21701482&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=729d6c77cd&password=82f0e3ad1c&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=7535186f0b&password=david318c3ac8a0&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=76fc2ac678&password=124a0f56628b&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=7b2c05686a&password=e7c3327d6510&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=7d39758331&password=d6edc66f5935&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=7wl5yingnp&password=5p65j8yk9l&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=8001ac32290f&password=6f827a0c99c5&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=846da3d092&password=1e48343935&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=849ac36031&password=ef5289f39fa8&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=87be509e77&password=3eab34c74d6c&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=8a0ff58803&password=f93cc46a1da5&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=8f629e7398&password=0a95be41bac6&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=93bc10403f&password=18a61ca75c4a&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=943ff4e380&password=5cafbf676717&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=988a7fce70&password=f1b0d91cb30b&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=99821c5627&password=b80544c6ec6e&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=a25b91f1aa&password=4a684e84bb8e&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=a6c1559054&password=bfc1dd43d01d&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=a962f9436d&password=16de438307fa&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=ac7d3b8a19&password=5c7efb80a1ce&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=ad338ec1b5&password=3b3229a2fb74&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=ad59472dd4&password=062dbb1038df&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=ae979c1be5&password=df426ee79e0b&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=af60ffe4c0&password=c7320bccc6c1&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=b0wy2izi1r&password=22700b675bf0&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=b30940d80c&password=3bc1d10fd4a2&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=b3301af697&password=f363be61637d&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=b39fab07d3&password=87f21c293819&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=b4aff583f5&password=df4dc28a227e&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=b5a5ddd58ca7&password=390db25bc112&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=bb5bd31494&password=acce56b72176&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=bdc0c40d43&password=dafdf6bfa473&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=c2f54e1afc&password=1af5e6a675&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=c385f3e88f&password=ef2363b4d83f&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=c46f890173&password=07d44d45dbec&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=ca864dae82&password=8d1bd2662113&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=cab7943b7f&password=70c30b0a2c7c&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=cc1d647918&password=28f3d7c9fb2d&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=cd10e2e437&password=f1cc09d8e7e5&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=ceaa74ff52&password=94c8c718144d&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=d30fcd04d7&password=15c6cd4296d0&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=d459ef8eac&password=7aa71555a757&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=d557d7eaccf5&password=efcebd8a255f&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=d7c3ec6702&password=e2a9fbfc7691&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=d8ad2a8dac&password=fc54f1a5d019&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=d93e94b3bd&password=b043d0034634&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=d9fe31208b&password=067215f031e7&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=dc2f93a45f&password=ff1892797ca9&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=e315404437&password=33f736r3i2&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=e4096cee7204&password=1dba2c452c8c&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=e40eedd634&password=bbcd299fcbdc&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=e4b9408561&password=983928d1ce12&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=e75cc54170&password=f82a3083c4d2&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=e826707f98&password=fec02df5b4d9&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=ec3e672860&password=d106f032f4&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=eexs4hmyzl&password=090ab45b68bf&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=eff0606222&password=7c212dd5008d&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=f1cec6af94&password=9a7c3256dfdf&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=f2460aa362&password=1e6ca9faed&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=f55379e921&password=312bfef9397a&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=f607fff316&password=ap9qk4pkl6&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=f615c94568&password=69ebed86acd0&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=f74ac62ce4&password=ee620c2e071e&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=f8daae4752&password=ba6ca13beae0&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=f9bdd4ce7b&password=7a61cfbe7ff3&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=f9f008e2b2&password=c1498bd75a90&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=fc678bb5dc&password=4454f65a00f5&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=fe5869ec1f&password=aa343fad795f&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=ff82bfb932&password=8607291452f2&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=fU34zQhV2afR&password=Y7wgBcKU4VDn&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=gjbqb3wem5&password=c8e7c522b4&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=ik8m04zzkd&password=u2hx40rmqs&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=ojf63tzm56&password=49l8y3ddew&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=qv2d58qpdp&password=rou5t1f62r&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=r476u9j3l1&password=7yolkyncby&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=tzd9bgmpd8&password=fd607v18xt&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=We1uf0gJYGXT&password=6Kq0gbnaY7dX&type=m3u_plus",
  "http://jeupourvous.xyz:80/get.php?username=x1wz9z2sn9&password=qpp6ipt8v5&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=0422635871&password=d05a9d4b21e6&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=05bd292723&password=orl31p01pl&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=061a86247e&password=ffff810563c7&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=069e9c84d0&password=8b02b808e4f2&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=08db0f5083&password=1c61ac6dedf6&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=0c1f92b1c9&password=e85604c9a31e&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=0da5c02df5&password=0f47a7d7df&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=0e376faace&password=7e9f63747ffd&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=0e3e611622bd&password=ec4ed7803aaf&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=119985ffbd&password=44449d2ce4ed&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=13de3339c4&password=e495daeface5&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=1569818b04&password=50aec67baa&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=18593b4158&password=82ebc9b0eca1&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=190492996f&password=e1510e6ac83e&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=1ae2db0d94&password=f15b667ceb37&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=1bbfbf8c6f&password=17c406a1f1ae&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=1d8aaedd09&password=96b08fae0dd1&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=1ddf16fae2&password=fb1ac6874ad7&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=1fad7673b1&password=c5c6457335e4&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=1nfzxq7vqp&password=lnedu66eqq&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=20415dada8&password=9ee5f3a921&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=22c06934fc&password=d7b364da652a&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=232dc7e7f2&password=987b37712f7a&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=2534033244&password=f5uakk397a&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=2a32131489&password=a229734d72b8&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=2a9fce3511&password=a9ecd0894cf3&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=2c0daa29e1&password=dc00b799276e&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=2f0ab7c32f&password=f5e2f8cbdae7&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=32a9845ad5&password=64127c1912f2&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=341f50ce8e&password=76666377d6dd&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=37333fd199&password=144c21991781&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=3a2cba0476&password=1e9086caa8&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=3e7d97dd0f&password=a6624afa65be&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=4098ed2cf4&password=e1f5ca0675&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=40c710a5e1&password=5595a2beee30&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=41c71b1601&password=59359ecf750d&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=4299805f7f&password=045310756ba8&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=4b3d0f1829&password=cd0294a5f6d5&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=4c65afd1e1&password=47c857f4e58f&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=4cfe920f52&password=a3cbed680b7c&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=4d84a5a8a8&password=827079e7aacd&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=4e6443533e&password=7520571312bf&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=4xojv5pkx0&password=cacb6c11ae92&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=54d73a234f&password=jlzlxbcltt&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=562aca0ca9&password=9d37a4c809c4&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=5b39ebc76c&password=98d077d50b01&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=5b75ae16e9&password=85e8f17616b3&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=5d283ff331&password=a0d7f1b56835&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=6104f27e28&password=186fa0a4da9f&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=61c6809130&password=7b2e56654d&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=63b9b21ce4ad3&password=69f0b36daa&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=641e2ae814&password=77faca967c6b&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=64d123b229a59&password=c370c1c843&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=650736e08b9e5&password=bf9b3b3673&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=6544afd5d5&password=n9wjg5kkxa&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=661e12c78a&password=5cce93c8d2f0&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=665e0c6b68adf&password=1b7352aab3&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=6665cbbaa8&password=c89825745b71&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=67164bd274&password=7147143128dd&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=67332cc25de37&password=5f5873c57e&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=6787fdb8a3&password=a5c3ffdf7cf1&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=67921150517a9&password=9cae812992&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=67af726bd2022&password=72f011fa23&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=68674d6b99&password=a69bd3a0ba99&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=68ee210a1d&password=zukovic&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=6997437497511&password=96037c6653&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=699b61209b&password=c67291b69455&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=6d8c5d861e&password=665220b3cc4e&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=6fd271f9b2&password=0678c1351e26&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=704ae5f42a&password=7323e685d825&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=70fc282686&password=f9097354bd8b&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=7164844146&password=202a21701482&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=729d6c77cd&password=82f0e3ad1c&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=7535186f0b&password=david318c3ac8a0&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=76fc2ac678&password=124a0f56628b&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=7b2c05686a&password=e7c3327d6510&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=7d39758331&password=d6edc66f5935&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=7wl5yingnp&password=5p65j8yk9l&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=8001ac32290f&password=6f827a0c99c5&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=846da3d092&password=1e48343935&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=849ac36031&password=ef5289f39fa8&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=87be509e77&password=3eab34c74d6c&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=8a0ff58803&password=f93cc46a1da5&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=8f629e7398&password=0a95be41bac6&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=93bc10403f&password=18a61ca75c4a&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=943ff4e380&password=5cafbf676717&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=988a7fce70&password=f1b0d91cb30b&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=99821c5627&password=b80544c6ec6e&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=a25b91f1aa&password=4a684e84bb8e&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=a6c1559054&password=bfc1dd43d01d&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=a962f9436d&password=16de438307fa&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=ac7d3b8a19&password=5c7efb80a1ce&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=ad338ec1b5&password=3b3229a2fb74&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=ad59472dd4&password=062dbb1038df&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=ae979c1be5&password=df426ee79e0b&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=af60ffe4c0&password=c7320bccc6c1&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=b0wy2izi1r&password=22700b675bf0&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=b30940d80c&password=3bc1d10fd4a2&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=b3301af697&password=f363be61637d&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=b39fab07d3&password=87f21c293819&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=b4aff583f5&password=df4dc28a227e&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=b5a5ddd58ca7&password=390db25bc112&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=bb5bd31494&password=acce56b72176&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=bdc0c40d43&password=dafdf6bfa473&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=c2f54e1afc&password=1af5e6a675&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=c385f3e88f&password=ef2363b4d83f&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=c46f890173&password=07d44d45dbec&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=ca864dae82&password=8d1bd2662113&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=cab7943b7f&password=70c30b0a2c7c&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=cc1d647918&password=28f3d7c9fb2d&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=cd10e2e437&password=f1cc09d8e7e5&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=ceaa74ff52&password=94c8c718144d&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=d30fcd04d7&password=15c6cd4296d0&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=d459ef8eac&password=7aa71555a757&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=d557d7eaccf5&password=efcebd8a255f&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=d7c3ec6702&password=e2a9fbfc7691&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=d8ad2a8dac&password=fc54f1a5d019&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=d93e94b3bd&password=b043d0034634&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=d9fe31208b&password=067215f031e7&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=dc2f93a45f&password=ff1892797ca9&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=e315404437&password=33f736r3i2&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=e4096cee7204&password=1dba2c452c8c&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=e40eedd634&password=bbcd299fcbdc&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=e4b9408561&password=983928d1ce12&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=e75cc54170&password=f82a3083c4d2&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=e826707f98&password=fec02df5b4d9&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=ec3e672860&password=d106f032f4&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=eexs4hmyzl&password=090ab45b68bf&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=eff0606222&password=7c212dd5008d&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=f1cec6af94&password=9a7c3256dfdf&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=f2460aa362&password=1e6ca9faed&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=f55379e921&password=312bfef9397a&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=f607fff316&password=ap9qk4pkl6&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=f615c94568&password=69ebed86acd0&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=f74ac62ce4&password=ee620c2e071e&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=f8daae4752&password=ba6ca13beae0&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=f9bdd4ce7b&password=7a61cfbe7ff3&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=f9f008e2b2&password=c1498bd75a90&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=fc678bb5dc&password=4454f65a00f5&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=fe5869ec1f&password=aa343fad795f&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=ff82bfb932&password=8607291452f2&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=fU34zQhV2afR&password=Y7wgBcKU4VDn&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=gjbqb3wem5&password=c8e7c522b4&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=ik8m04zzkd&password=u2hx40rmqs&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=ojf63tzm56&password=49l8y3ddew&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=qv2d58qpdp&password=rou5t1f62r&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=r476u9j3l1&password=7yolkyncby&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=tzd9bgmpd8&password=fd607v18xt&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=We1uf0gJYGXT&password=6Kq0gbnaY7dX&type=m3u_plus",
  "http://20818-techno.ott-cdn.me:80/get.php?username=x1wz9z2sn9&password=qpp6ipt8v5&type=m3u_plus",
];

function getServerLabel(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname;
  } catch {
    return url.slice(0, 40);
  }
}

function getShortLabel(url: string): string {
  const match = url.match(/username=([^&]+)/);
  return match ? match[1].slice(0, 12) + "..." : url.slice(0, 20);
}

const PROXY_BASE = "/api/m3u-proxy?url=";

function proxyUrl(url: string): string {
  return `${PROXY_BASE}${encodeURIComponent(url)}`;
}

function parseM3u(text: string): M3uEntry[] {
  const lines = text.split("\n");
  const entries: M3uEntry[] = [];
  let currentExtinf: string | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith("#EXTINF:")) {
      currentExtinf = line;
    } else if (line && !line.startsWith("#") && currentExtinf) {
      const logoMatch = currentExtinf.match(/tvg-logo="([^"]*)"/);
      const groupMatch = currentExtinf.match(/group-title="([^"]*)"/);
      const namePart = currentExtinf.split(",").pop()?.trim() || "Unknown";
      entries.push({
        name: namePart,
        url: line,
        originalUrl: line,
        logo: logoMatch?.[1] || null,
        group: groupMatch?.[1] || null,
      });
      currentExtinf = null;
    }
  }
  return entries;
}

export default function M3uTestPage() {
  const [entries, setEntries] = useState<M3uEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<M3uEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [serverStatus, setServerStatus] = useState<Record<string, ServerInfo>>({});
  const [activeServerUrl, setActiveServerUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const servers = useMemo(() => {
    const map = new Map<string, { label: string; urls: string[] }>();
    for (const url of SERVER_URLS) {
      const host = getServerLabel(url);
      if (!map.has(host)) map.set(host, { label: host, urls: [] });
      map.get(host)!.urls.push(url);
    }
    return Array.from(map.values());
  }, []);

  const loadServer = useCallback(async (url: string) => {
    setLoading(true);
    setError(null);
    setActiveServerUrl(url);
    setServerStatus((prev) => ({
      ...prev,
      [url]: { ...prev[url], label: getShortLabel(url), url, status: "loading", count: 0 },
    }));

    try {
      const res = await fetch(proxyUrl(url));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const parsed = parseM3u(text).map((e) => ({ ...e, url: proxyUrl(e.url) }));
      setEntries(parsed);
      if (parsed.length > 0) setSelectedEntry(parsed[0]);
      setServerStatus((prev) => ({
        ...prev,
        [url]: { label: getShortLabel(url), url, status: "ok", count: parsed.length },
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Fetch failed";
      setError(msg);
      setEntries([]);
      setServerStatus((prev) => ({
        ...prev,
        [url]: { label: getShortLabel(url), url, status: "error", count: 0 },
      }));
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.toLowerCase();
    return entries.filter((e) => e.name.toLowerCase().includes(q));
  }, [entries, searchQuery]);

  const selectEntry = useCallback((entry: M3uEntry) => {
    setSelectedEntry(entry);
  }, []);

  const totalEntries = entries.length;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col gap-12 flex-1">
        {/* Hero */}
        <div className="relative border border-border-alt bg-card overflow-hidden p-8 md:p-12">
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/[0.03] rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

          <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 border border-border-alt bg-hover text-[10px] font-mono uppercase tracking-widest text-fg-dim">
                <Server className="w-3 h-3 text-red-500" />
                M3U Test
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-fg font-mono leading-tight">
                M3U Playground<span className="text-red-500">.</span>
              </h1>
              <p className="text-sm font-mono text-fg-dim max-w-2xl leading-relaxed">
                Test IPTV playlist URLs, fetch and play channels.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 border border-border-alt bg-input text-xs font-mono text-fg-dim hover:text-fg hover:border-border-alt transition-all shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Lobby
            </Link>
          </div>
          <p className="text-[11px] font-mono text-yellow-500/80 leading-relaxed text-center mt-6">
            Select a server below to load its channel list.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_240px] gap-6 flex-1 min-h-0 overflow-hidden grid-rows-[1fr]">
          {/* Left: Server list */}
          <div className="hidden lg:flex lg:flex-col border border-border-alt bg-card overflow-hidden min-h-0">
            <div className="text-[10px] font-mono text-fg-dim uppercase tracking-widest px-3 py-2 border-b border-border-alt shrink-0">
              Servers ({SERVER_URLS.length})
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 space-y-2 p-2 scrollbar-red">
              {servers.map((server) => (
                <div key={server.label}>
                  <div className="text-[10px] font-mono text-fg-faint uppercase tracking-wider px-2 py-1 border-b border-border-alt mb-1">
                    {server.label}
                  </div>
                  <div className="space-y-1">
                    {server.urls.map((url) => {
                      const status = serverStatus[url];
                      return (
                        <button
                          key={url}
                          onClick={() => loadServer(url)}
                          className={`w-full text-left border p-2 transition-all cursor-pointer group ${
                            activeServerUrl === url
                              ? "border-red-500/30 bg-red-500/[0.03]"
                              : "border-border-alt bg-card hover:border-red-500/10 hover:bg-red-500/[0.02]"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {status?.status === "loading" ? (
                              <Loader2 className="w-3 h-3 text-yellow-500 animate-spin shrink-0" />
                            ) : status?.status === "ok" ? (
                              <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
                            ) : status?.status === "error" ? (
                              <AlertCircle className="w-3 h-3 text-red-500 shrink-0" />
                            ) : (
                              <Server className="w-3 h-3 text-fg-dim shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="text-[10px] font-mono font-semibold truncate text-fg group-hover:text-red-400 transition-colors">
                                {getShortLabel(url)}
                              </div>
                              {status && status.count > 0 && (
                                <div className="text-[9px] font-mono text-fg-dim">
                                  {status.count} channels
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Middle: Player */}
          <div className="min-w-0 w-full min-h-0 flex flex-col gap-3">
            {loading ? (
              <div className="flex-1 flex items-center justify-center border border-border-alt bg-card">
                <div className="flex flex-col items-center gap-3 py-16">
                  <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                  <span className="font-mono text-xs text-fg-dim uppercase tracking-widest">Loading playlist...</span>
                </div>
              </div>
            ) : error ? (
              <div className="flex-1 flex items-center justify-center border border-border-alt bg-card">
                <div className="text-center space-y-3 py-16">
                  <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
                  <p className="font-mono text-sm text-red-500 font-semibold">Failed to load</p>
                  <p className="font-mono text-[10px] text-fg-faint uppercase tracking-widest">{error}</p>
                </div>
              </div>
            ) : selectedEntry ? (
              <>
                <div className="flex items-center justify-between border border-border-alt bg-card p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center overflow-hidden shrink-0">
                      {selectedEntry.logo ? (
                        <img src={selectedEntry.logo} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Tv className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-mono text-lg font-bold text-fg tracking-tight truncate">{selectedEntry.name}</h2>
                      {selectedEntry.group && (
                        <p className="font-mono text-xs text-fg-dim">{selectedEntry.group}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono text-fg-dim shrink-0">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-fg font-bold">STREAM</span>
                    </span>
                  </div>
                </div>

                <VideoPlayer
                  streamUrl={selectedEntry.url}
                  streamType={selectedEntry.originalUrl.match(/\.ts($|\?)/) ? "direct" : "hls"}
                  clearKeys={null}
                />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="border border-border-alt bg-card p-4 text-center hover:border-red-500/20 transition-all group">
                    <div className="flex items-center justify-center gap-1.5 mb-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Signal</span>
                    </div>
                    <p className="font-mono text-sm font-bold text-green-500">ACTIVE</p>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-fg-dim mt-1">Status</p>
                  </div>
                  <div className="border border-border-alt bg-card p-4 text-center hover:border-red-500/20 transition-all group">
                    <Zap className="w-4 h-4 text-fg-faint group-hover:text-red-500/60 mx-auto mb-2 transition-colors" />
                    <p className="font-mono text-sm font-bold text-fg">HLS</p>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-fg-dim mt-1">Stream Type</p>
                  </div>
                  <div className="border border-border-alt bg-card p-4 text-center hover:border-red-500/20 transition-all group">
                    <Shield className="w-4 h-4 text-fg-faint group-hover:text-red-500/60 mx-auto mb-2 transition-colors" />
                    <p className="font-mono text-sm font-bold text-fg">NONE</p>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-fg-dim mt-1">Drm</p>
                  </div>
                  <div className="border border-border-alt bg-card p-4 text-center hover:border-red-500/20 transition-all group">
                    <Monitor className="w-4 h-4 text-fg-faint group-hover:text-red-500/60 mx-auto mb-2 transition-colors" />
                    <p className="font-mono text-sm font-bold text-fg">{totalEntries}</p>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-fg-dim mt-1">Channels</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center border border-border-alt bg-card">
                <div className="text-center space-y-3 py-16">
                  <div className="w-12 h-12 rounded-xl border border-border-alt bg-hover flex items-center justify-center mx-auto">
                    <Server className="w-6 h-6 text-fg-dim" />
                  </div>
                  <p className="font-mono text-sm text-fg-dim font-semibold">Select a server</p>
                  <p className="font-mono text-[10px] text-fg-faint uppercase tracking-widest">
                    Choose from the left panel to load channels
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right: Channel list */}
          <div className="hidden lg:flex lg:flex-col border border-border-alt bg-card overflow-hidden min-h-0">
            <div className="text-[10px] font-mono text-fg-dim uppercase tracking-widest px-3 py-2 border-b border-border-alt shrink-0">
              {totalEntries} channel{totalEntries !== 1 ? "s" : ""}
            </div>
            <div className="flex items-center gap-2 border-b border-border-alt bg-card px-3 py-2 shrink-0">
              <Search className="w-3.5 h-3.5 text-fg-dim shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter..."
                className="bg-transparent text-xs font-mono text-fg placeholder:text-fg-faint outline-none w-full"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery("")} className="text-fg-dim hover:text-fg">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 space-y-1 p-2 scrollbar-red">
              {filteredEntries.map((entry, i) => (
                <button
                  key={`${entry.name}-${i}`}
                  onClick={() => selectEntry(entry)}
                  className={`w-full text-left border p-3 transition-all cursor-pointer group ${
                    selectedEntry?.url === entry.url
                      ? "border-red-500/30 bg-red-500/[0.03]"
                      : "border-border-alt bg-card hover:border-red-500/10 hover:bg-red-500/[0.02]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`relative w-8 h-8 border flex items-center justify-center shrink-0 overflow-hidden transition-all ${
                      selectedEntry?.url === entry.url
                        ? "border-red-500/20 bg-red-500/10"
                        : "border-border-alt bg-hover group-hover:border-red-500/20 group-hover:bg-red-500/10"
                    }`}>
                      {entry.logo ? (
                        <img src={entry.logo} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Tv className={`w-3.5 h-3.5 transition-colors ${
                          selectedEntry?.url === entry.url ? "text-red-400" : "text-fg-dim group-hover:text-red-400"
                        }`} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={`text-xs font-mono font-semibold truncate transition-colors ${
                        selectedEntry?.url === entry.url ? "text-red-400" : "text-fg group-hover:text-red-400"
                      }`}>
                        {entry.name}
                      </div>
                      {entry.group && (
                        <div className="text-[9px] font-mono text-fg-dim mt-0.5">
                          {entry.group.toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
              {filteredEntries.length === 0 && (
                <div className="text-center py-10">
                  <p className="font-mono text-[10px] text-fg-faint uppercase tracking-widest">
                    {entries.length === 0 ? "No channels loaded" : "No channels found"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
