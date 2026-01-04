/**
 * Word Data with Spaced Repetition (SM-2 inspired)
 * Organized by lessons (9 lessons × 15 phrases = 135 total)
 */

// Type definitions
export interface Phrase {
    term: string;
    pinyin: string;
}

export interface Lesson {
    id: number;
    title: string;
    phrases: Phrase[];
}

export interface WordState {
    score: number;
    interval: number;
    nextReview: string;
    easeFactor: number;
    timesCorrect: number;
    timesMistaken: number;
}

export interface PlayerStats {
    totalXP: number;
    dailyStreak: number;
    lastPlayedDate: string | null;
    wordsLearned: number;
    perfectWords: number;
    totalSessions: number;
    achievements: string[];
    currentLessonId: number;
}

export interface Achievement {
    id: string;
    name: string;
    desc: string;
    icon: string;
    check: () => boolean;
    unlocked?: boolean;
}

// Attempt logging for tracking performance
export interface AttemptLog {
    timestamp: string;
    lessonId: number;
    lessonTitle: string;
    mode: 'spelling' | 'dictation';
    phrases: {
        term: string;
        correct: boolean;
        mistakeCount: number;
        hintUsed: boolean;
    }[];
    totalScore: number;
    totalPhrases: number;
    duration: number; // seconds
}

const STORAGE_KEY = 'tingxie_word_data';
const STATS_KEY = 'tingxie_stats';
const ATTEMPT_LOG_KEY = 'tingxie_attempt_log';

// 9 Lessons × 15 Phrases = 135 vocabulary items
export const LESSONS: Lesson[] = [
    {
        id: 1,
        title: "第一课: 一起看电视",
        phrases: [
            { term: "播放新闻", pinyin: "bō fàng xīn wén" },
            { term: "刚才", pinyin: "gāng cái" },
            { term: "手舞足蹈", pinyin: "shǒu wǔ zú dǎo" },
            { term: "合理建议", pinyin: "hé lǐ jiàn yì" },
            { term: "共同完成", pinyin: "gòng tóng wán chéng" },
            { term: "岛国", pinyin: "dǎo guó" },
            { term: "国内外", pinyin: "guó nèi wài" },
            { term: "保守秘密", pinyin: "bǎo shǒu mì mì" },
            { term: "共用雨伞", pinyin: "gòng yòng yǔ sǎn" },
            { term: "舞蹈精彩", pinyin: "wǔ dǎo jīng cǎi" },
            { term: "精彩的表演", pinyin: "jīng cǎi de biǎo yǎn" },
            { term: "忍不住", pinyin: "rěn bu zhù" },
            { term: "提出建议", pinyin: "tí chū jiàn yì" },
            { term: "议论纷纷", pinyin: "yì lùn fēn fēn" },
            { term: "华乐团的表演太精彩了，观众们忍不住拍手叫好。", pinyin: "Huá yuè tuán de biǎo yǎn tài jīng cǎi le , guān zhòng men rěn bu zhù pāi shǒu jiào hǎo ." }
        ]
    },
    {
        id: 2,
        title: "第二课: 我们是兄弟姐妹",
        phrases: [
            { term: "苹果", pinyin: "píng guǒ" },
            { term: "害怕", pinyin: "hài pà" },
            { term: "递给姑姑", pinyin: "dì gěi gū gu" },
            { term: "担心害怕", pinyin: "dān xīn hài pà" },
            { term: "抓紧", pinyin: "zhuā jǐn" },
            { term: "解释词语", pinyin: "jiě shì cí yǔ" },
            { term: "车厢拥挤", pinyin: "chē xiāng yōng jǐ" },
            { term: "表示同意", pinyin: "biǎo shì tóng yì" },
            { term: "鱼丸", pinyin: "yú wán" },
            { term: "忽然靠近", pinyin: "hū rán kào jìn" },
            { term: "乌云密布", pinyin: "wū yún mì bù" },
            { term: "受到鼓励", pinyin: "shòu dào gǔ lì" },
            { term: "温暖", pinyin: "wēn nuǎn" },
            { term: "灵机一动", pinyin: "líng jī yí dòng" },
            { term: "解决", pinyin: "jiě jué" },
            { term: "皱紧眉头", pinyin: "zhòu jǐn méi tóu" },
            { term: "忽然想起", pinyin: "hū rán xiǎng qǐ" },
            { term: "热烈鼓掌", pinyin: "rè liè gǔ zhǎng" },
            { term: "伟明听了姑姑鼓励的话语，感到非常温暖。", pinyin: "Wěi míng tīng le gū gu gǔ lì de huà yǔ , gǎn dào fēi cháng wēn nuǎn ." },
            { term: "弟弟灵机一动，想到了解决这道难题的好方法。", pinyin: "Dì di líng jī yí dòng , xiǎng dào le jiě jué zhè dào nán tí de hǎo fāng fǎ ." }
        ]
    },
    {
        id: 3,
        title: "第三课: 妈妈，对不起",
        phrases: [
            { term: "警察", pinyin: "jǐng chá" },
            { term: "煮饭", pinyin: "zhǔ fàn" },
            { term: "补习", pinyin: "bǔ xí" },
            { term: "眼泪", pinyin: "yǎn lèi" },
            { term: "脾气温和", pinyin: "pí qì wēn hé" },
            { term: "街道干净", pinyin: "jiē dào gān jìng" },
            { term: "饭碗", pinyin: "fàn wǎn" },
            { term: "深夜", pinyin: "shēn yè" },
            { term: "睁开眼睛", pinyin: "zhēng kāi yǎn jīng" },
            { term: "云吞面", pinyin: "yún tūn miàn" },
            { term: "尊敬长辈", pinyin: "zūn jìng zhǎng bèi" },
            { term: "迷路", pinyin: "mí lù" },
            { term: "感到后悔", pinyin: "gǎn dào hòu huǐ" },
            { term: "舍不得", pinyin: "shě bu de" },
            { term: "伤心流泪", pinyin: "shāng xīn liú lèi" },
            { term: "家明迷上电脑游戏后，成绩一落千丈。他感到很后悔。", pinyin: "Jiā míng mí shàng diàn nǎo yóu xì hòu , chéng jì yí luò qiān zhàng . Tā gǎn dào hěn hòu huǐ ." },
            { term: "这个笔袋是奶奶送的，虽然它很旧了，但是我舍不得丢掉。", pinyin: "Zhè ge bǐ dài shì nǎi nai sòng de , suī rán tā hěn jiù le , dàn shì wǒ shě bu de diū diào ." }
        ]
    },
    {
        id: 4,
        title: "第四课: 今天我值日",
        phrases: [
            { term: "保证完成", pinyin: "bǎo zhèng wán chéng" },
            { term: "皱眉", pinyin: "zhòu méi" },
            { term: "提醒观众", pinyin: "tí xǐng guān zhòng" },
            { term: "注意休息", pinyin: "zhù yì xiū xi" },
            { term: "影响学习", pinyin: "yǐng xiǎng xué xí" },
            { term: "不要插队", pinyin: "bú yào chā duì" },
            { term: "来到食堂", pinyin: "lái dào shí táng" },
            { term: "难为情", pinyin: "nán wéi qíng" },
            { term: "保持安静", pinyin: "bǎo chí ān jìng" },
            { term: "归还碗盘", pinyin: "guī huán wǎn pán" },
            { term: "由于", pinyin: "yóu yú" },
            { term: "课室", pinyin: "kè shì" },
            { term: "打扫干净", pinyin: "dǎ sǎo gān jìng" },
            { term: "责任心", pinyin: "zé rèn xīn" },
            { term: "值得", pinyin: "zhí dé" },
            { term: "注意安全", pinyin: "zhù yì ān quán" },
            { term: "由于下大雨，爸爸早上没去跑步。", pinyin: "Yóu yú xià dà yǔ , bà ba zǎo shang méi qù pǎo bù ." },
            { term: "值日生要有责任心，把课室打扫干净。", pinyin: "Zhí rì shēng yào yǒu zé rèn xīn , bǎ kè shì dǎ sǎo gān jìng ." }
        ]
    },
    {
        id: 5,
        title: "第五课: 我不怕打针",
        phrases: [
            { term: "课室", pinyin: "kè shì" },
            { term: "打针", pinyin: "dǎ zhēn" },
            { term: "结束", pinyin: "jié shù" },
            { term: "伸手", pinyin: "shēn shǒu" },
            { term: "闭眼睛", pinyin: "bì yǎn jīng" },
            { term: "继续前进", pinyin: "jì xù qián jìn" },
            { term: "欺骗", pinyin: "qī piàn" },
            { term: "痛苦", pinyin: "tòng kǔ" },
            { term: "吃药", pinyin: "chī yào" },
            { term: "爱戴老师", pinyin: "ài dài lǎo shī" },
            { term: "胆量过人", pinyin: "dǎn liàng guò rén" },
            { term: "差一点儿", pinyin: "chà yì diǎnr" },
            { term: "闷闷不乐", pinyin: "mèn mèn bú lè" },
            { term: "建议", pinyin: "jiàn yì" },
            { term: "闭目养神", pinyin: "bì mù yǎng shén" },
            { term: "我接受父母的建议，不沉迷手机，多运动多阅读。", pinyin: "Wǒ jiē shòu fù mǔ de jiàn yì , bù chén mí shǒu jī , duō yùn dòng duō yuè dú ." }
        ]
    },
    {
        id: 6,
        title: "第六课: 我要参加什么活动呢",
        phrases: [
            { term: "所以", pinyin: "suǒ yǐ" },
            { term: "辛苦", pinyin: "xīn kǔ" },
            { term: "幸运", pinyin: "xìng yùn" },
            { term: "学会分享", pinyin: "xué huì fēn xiǎng" },
            { term: "好久不见", pinyin: "hǎo jiǔ bú jiàn" },
            { term: "许多", pinyin: "xǔ duō" },
            { term: "功夫", pinyin: "gōng fu" },
            { term: "团队", pinyin: "tuán duì" },
            { term: "童子军", pinyin: "tóng zǐ jūn" },
            { term: "热烈欢迎", pinyin: "rè liè huān yíng" },
            { term: "身体健康", pinyin: "shēn tǐ jiàn kāng" },
            { term: "丰富多彩", pinyin: "fēng fù duō cǎi" },
            { term: "鼓励", pinyin: "gǔ lì" },
            { term: "刻苦的训练", pinyin: "kè kǔ de xùn liàn" },
            { term: "跑步比赛", pinyin: "pǎo bù bǐ sài" },
            { term: "内容丰富", pinyin: "nèi róng fēng fù" },
            { term: "经过刻苦的训练，我在游泳比赛中得了第一名。", pinyin: "Jīng guò kè kǔ de xùn liàn , wǒ zài yóu yǒng bǐ sài zhōng dé le dì yī míng ." },
            { term: "在父母的鼓励下，子明报名参加了运动会的跑步比赛。", pinyin: "Zài fù mǔ de gǔ lì xià , zǐ míng bào míng cān jiā le yùn dòng huì de pǎo bù bǐ sài ." }
        ]
    },
    {
        id: 7,
        title: "第七课: 他的脸红了",
        phrases: [
            { term: "耐心", pinyin: "nài xīn" },
            { term: "车厢", pinyin: "chē xiāng" },
            { term: "拼命", pinyin: "pīn mìng" },
            { term: "企鹅馆", pinyin: "qǐ é guǎn" },
            { term: "三五成群", pinyin: "sān wǔ chéng qún" },
            { term: "争抢", pinyin: "zhēng qiǎng" },
            { term: "劝告", pinyin: "quàn gào" },
            { term: "乘客", pinyin: "chéng kè" },
            { term: "表达歉意", pinyin: "biǎo dá qiàn yì" },
            { term: "遵守秩序", pinyin: "zūn shǒu zhì xù" },
            { term: "摇摇摆摆", pinyin: "yáo yáo bǎi bǎi" },
            { term: "批评", pinyin: "pī píng" },
            { term: "道歉", pinyin: "dào qiàn" },
            { term: "子华做功课时粗心大意，老师批评了他。", pinyin: "Zǐ huá zuò gōng kè shí cū xīn dà yì , lǎo shī pī píng le tā ." }
        ]
    },
    {
        id: 8,
        title: "第八课: 马路如虎口",
        phrases: [
            { term: "另外", pinyin: "lìng wài" },
            { term: "流血", pinyin: "liú xiě" },
            { term: "见义勇为", pinyin: "jiàn yì yǒng wéi" },
            { term: "几辆汽车", pinyin: "jǐ liàng qì chē" },
            { term: "交通规则", pinyin: "jiāo tōng guī zé" },
            { term: "车祸", pinyin: "chē huò" },
            { term: "了解情况", pinyin: "liǎo jiě qíng kuàng" },
            { term: "得到表扬", pinyin: "dé dào biǎo yáng" },
            { term: "顺利完成", pinyin: "shùn lì wán chéng" },
            { term: "医院", pinyin: "yī yuàn" },
            { term: "司机被困", pinyin: "sī jī bèi kùn" },
            { term: "马路如虎口", pinyin: "mǎ lù rú hǔ kǒu" },
            { term: "马路如虎口，因此我们过马路时，应该遵守交通规则。", pinyin: "Mǎ lù rú hǔ kǒu , yīn cǐ wǒ men guò mǎ lù shí , yīng gāi zūn shǒu jiāo tōng guī zé ." },
            { term: "被困在车里的司机得救后，医护人员马上送他去了医院。", pinyin: "Bèi kùn zài chē lǐ de sī jī dé jiù hòu , yī hù rén yuán mǎ shàng sòng tā qù le yī yuàn ." }
        ]
    },
    {
        id: 9,
        title: "第九课: 爱心无障碍",
        phrases: [
            { term: "炸鸡", pinyin: "zhá jī" },
            { term: "饮料", pinyin: "yǐn liào" },
            { term: "居民", pinyin: "jū mín" },
            { term: "告示牌", pinyin: "gào shì pái" },
            { term: "组屋楼下", pinyin: "zǔ wū lóu xià" },
            { term: "手指", pinyin: "shǒu zhǐ" },
            { term: "糖果", pinyin: "táng guǒ" },
            { term: "其中", pinyin: "qí zhōng" },
            { term: "重复几遍", pinyin: "chóng fù jǐ biàn" },
            { term: "熟食中心", pinyin: "shú shí zhōng xīn" },
            { term: "而且", pinyin: "ér qiě" },
            { term: "令人讨厌", pinyin: "lìng rén tǎo yàn" },
            { term: "发音清楚", pinyin: "fā yīn qīng chǔ" },
            { term: "解释清楚", pinyin: "jiě shì qīng chǔ" },
            { term: "丽美不但学习成绩好，而且乐于助人。", pinyin: "Lì měi bú dàn xué xí chéng jì hǎo , ér qiě lè yú zhù rén ." }
        ]
    },
    {
        id: 10,
        title: "第十课: 这样才对",
        phrases: [
            { term: "花洒", pinyin: "huā sǎ" },
            { term: "米粉", pinyin: "mǐ fěn" },
            { term: "不耐烦", pinyin: "bú nài fán" },
            { term: "清洁工人", pinyin: "qīng jié gōng rén" },
            { term: "不理不睬", pinyin: "bù lǐ bù cǎi" },
            { term: "不管", pinyin: "bù guǎn" },
            { term: "礼貌", pinyin: "lǐ mào" },
            { term: "显得年轻", pinyin: "xiǎn de nián qīng" },
            { term: "占位", pinyin: "zhàn wèi" },
            { term: "喊叫", pinyin: "hǎn jiào" },
            { term: "推门", pinyin: "tuī mén" },
            { term: "玩耍", pinyin: "wán shuǎ" },
            { term: "不肯帮助", pinyin: "bù kěn bāng zhù" },
            { term: "对人无礼", pinyin: "duì rén wú lǐ" }
        ]
    },
    {
        id: 11,
        title: "第十一课: 天天运动身体好",
        phrases: [
            { term: "欢呼", pinyin: "huān hū" },
            { term: "优秀", pinyin: "yōu xiù" },
            { term: "奔跑", pinyin: "bēn pǎo" },
            { term: "计时员", pinyin: "jì shí yuán" },
            { term: "到达终点", pinyin: "dào dá zhōng diǎn" },
            { term: "奖杯", pinyin: "jiǎng bēi" },
            { term: "命令", pinyin: "mìng lìng" },
            { term: "焦急", pinyin: "jiāo jí" },
            { term: "挥动彩旗", pinyin: "huī dòng cǎi qí" },
            { term: "不顾一切", pinyin: "bú gù yí qiè" },
            { term: "既然", pinyin: "jì rán" },
            { term: "争取", pinyin: "zhēng qǔ" },
            { term: "四年级", pinyin: "sì nián jí" },
            { term: "乐曲动听", pinyin: "yuè qǔ dòng tīng" },
            { term: "弟弟这次考试成绩不理想，他决心下次取得好成绩。", pinyin: "Dì di zhè cì kǎo shì chéng jì bù lǐ xiǎng , tā jué xīn xià cì qǔ dé hǎo chéng jì ." },
            { term: "我第一次代表班级参加演讲比赛，因此，我既紧张又兴奋。", pinyin: "Wǒ dì yī cì dài biǎo bān jí cān jiā yǎn jiǎng bǐ sài , yīn cǐ , wǒ jì jǐn zhāng yòu xīng fèn ." }
        ]
    },
    {
        id: 12,
        title: "第十二课: 我是小导游",
        phrases: [
            { term: "握手", pinyin: "wò shǒu" },
            { term: "士兵", pinyin: "shì bīng" },
            { term: "植物园", pinyin: "zhí wù yuán" },
            { term: "留作纪念", pinyin: "liú zuò jì niàn" },
            { term: "旅游景点", pinyin: "lǚ yóu jǐng diǎn" },
            { term: "商店", pinyin: "shāng diàn" },
            { term: "一阵风", pinyin: "yí zhèn fēng" },
            { term: "围了过去", pinyin: "wéi le guò qù" },
            { term: "东西南北", pinyin: "dōng xī nán běi" },
            { term: "面带微笑", pinyin: "miàn dài wēi xiào" },
            { term: "美术展览", pinyin: "měi shù zhǎn lǎn" },
            { term: "度假", pinyin: "dù jià" },
            { term: "充满信心", pinyin: "chōng mǎn xìn xīn" },
            { term: "为了充实自己，明光假期里读完了好几本课外书。", pinyin: "Wèi le chōng shí zì jǐ , míng guāng jià qī lǐ dú wán le hǎo jǐ běn kè wài shū ." },
            { term: "昨天，我们到老人院做义工，度过了难忘而有意义的一天。", pinyin: "Zuó tiān , wǒ men dào lǎo rén yuàn zuò yì gōng , dù guò le nán wàng ér yǒu yì yì de yì tiān ." }
        ]
    },
    {
        id: 13,
        title: "第十三课: 美猴王孙悟空",
        phrases: [
            { term: "一只猴子", pinyin: "yì zhī hóu zi" },
            { term: "几个男孩", pinyin: "jǐ gè nán hái" },
            { term: "学习本领", pinyin: "xué xí běn lǐng" },
            { term: "自言自语", pinyin: "zì yán zì yǔ" },
            { term: "特别的日子", pinyin: "tè bié de rì zi" },
            { term: "仔细挑选", pinyin: "zǐ xì tiāo xuǎn" },
            { term: "一扇木门", pinyin: "yí shàn mù mén" },
            { term: "拆除房屋", pinyin: "chāi chú fáng wū" },
            { term: "怒气冲冲", pinyin: "nù qì chōng chōng" },
            { term: "费了九牛二虎之力", pinyin: "fèi le jiǔ niú èr hǔ zhī lì" },
            { term: "丈二金刚摸不着头脑", pinyin: "zhàng èr jīn gāng mō bu zháo tóu nǎo" },
            { term: "花盆", pinyin: "huā pén" },
            { term: "立刻", pinyin: "lì kè" },
            { term: "家明不小心打破老婆婆家的花盆，他立刻向老婆婆承认错误。", pinyin: "Jiā míng bù xiǎo xīn dǎ pò lǎo pó po jiā de huā pén , tā lì kè xiàng lǎo pó po chéng rèn cuò wù ." }
        ]
    },
    {
        id: 14,
        title: "第十四课: 这个主意真棒",
        phrases: [
            { term: "竟然", pinyin: "jìng rán" },
            { term: "来到厨房", pinyin: "lái dào chú fáng" },
            { term: "一本字典", pinyin: "yì běn zì diǎn" },
            { term: "没有压力", pinyin: "méi yǒu yā lì" },
            { term: "刚巧掉落", pinyin: "gāng qiǎo diào luò" },
            { term: "凶巴巴", pinyin: "xiōng bā bā" },
            { term: "走进餐馆", pinyin: "zǒu jìn cān guǎn" },
            { term: "帮助穷人", pinyin: "bāng zhù qióng rén" },
            { term: "责骂孩子", pinyin: "zé mà hái zi" },
            { term: "样子可怜", pinyin: "yàng zi kě lián" },
            { term: "阅读", pinyin: "yuè dú" },
            { term: "不慌不忙", pinyin: "bù huāng bù máng" },
            { term: "香蕉蛋糕", pinyin: "xiāng jiāo dàn gāo" },
            { term: "为了提高语文能力，我们要养成阅读的好习惯。", pinyin: "Wèi le tí gāo yǔ wén néng lì , wǒ men yào yǎng chéng yuè dú de hǎo xí guàn ." }
        ]
    },
    {
        id: 15,
        title: "第十五课: 一年四季好风光",
        phrases: [
            { term: "堆雪人", pinyin: "duī xuě rén" },
            { term: "寄出信件", pinyin: "jì chū xìn jiàn" },
            { term: "一条短裤", pinyin: "yì tiáo duǎn kù" },
            { term: "几双手套", pinyin: "jǐ shuāng shǒu tào" },
            { term: "到了年底", pinyin: "dào le nián dǐ" },
            { term: "收集邮票", pinyin: "shōu jí yóu piào" },
            { term: "气候潮湿", pinyin: "qì hòu cháo shī" },
            { term: "戴上帽子", pinyin: "dài shàng mào zi" },
            { term: "天气炎热", pinyin: "tiān qì yán rè" },
            { term: "一双拖鞋", pinyin: "yì shuāng tuō xié" },
            { term: "舒服", pinyin: "shū fu" },
            { term: "寒冷的冬天", pinyin: "hán lěng de dōng tiān" },
            { term: "最近天气凉爽，不冷不热，很舒服。", pinyin: "Zuì jìn tiān qì liáng shuǎng , bù lěng bú rè , hěn shū fu ." }
        ]
    },
    {
        id: 16,
        title: "第十六课: 多彩的动物世界",
        phrases: [
            { term: "小丑", pinyin: "xiǎo chǒu" },
            { term: "蹲下", pinyin: "dūn xià" },
            { term: "翅膀", pinyin: "chì bǎng" },
            { term: "侧面", pinyin: "cè miàn" },
            { term: "挂国旗", pinyin: "guà guó qí" },
            { term: "手臂", pinyin: "shǒu bì" },
            { term: "鸭子", pinyin: "yā zi" },
            { term: "漂亮", pinyin: "piào liang" },
            { term: "绕道", pinyin: "rào dào" },
            { term: "风吹日晒", pinyin: "fēng chuī rì shài" },
            { term: "与众不同", pinyin: "yǔ zhòng bù tóng" },
            { term: "趴在地上", pinyin: "pā zài dì shang" },
            { term: "加快速度", pinyin: "jiā kuài sù dù" },
            { term: "惊奇不已", pinyin: "jīng qí bù yǐ" },
            { term: "三岁的表妹竟然会背几十首唐诗，我们都惊奇不已。", pinyin: "Sān suì de biǎo mèi jìng rán huì bèi jǐ shí shǒu táng shī , wǒ men dōu jīng qí bù yǐ ." }
        ]
    }
];

// Legacy compatibility - flat list of all words
export interface Word {
    term: string;
    pinyin: string;
    level: number;
    lessonId: number;
}

// Get all words as flat array for backward compatibility
export function getAllWords(): Word[] {
    const words: Word[] = [];
    LESSONS.forEach(lesson => {
        lesson.phrases.forEach((phrase, index) => {
            words.push({
                term: phrase.term,
                pinyin: phrase.pinyin,
                level: Math.ceil((index + 1) / 3), // 5 levels per lesson
                lessonId: lesson.id
            });
        });
    });
    return words;
}

// Word learning state - stored separately
let wordState: Record<string, WordState> = {};

// Player statistics
let playerStats: PlayerStats = {
    totalXP: 0,
    dailyStreak: 0,
    lastPlayedDate: null,
    wordsLearned: 0,
    perfectWords: 0,
    totalSessions: 0,
    achievements: [],
    currentLessonId: 1
};

/**
 * Get today's date as string (YYYY-MM-DD)
 */
function getToday(): string {
    return new Date().toISOString().split('T')[0];
}

/**
 * Initialize word state for all words
 */
function initWordState(): void {
    LESSONS.forEach(lesson => {
        lesson.phrases.forEach(phrase => {
            if (!wordState[phrase.term]) {
                wordState[phrase.term] = {
                    score: 0,
                    interval: 0,
                    nextReview: getToday(),
                    easeFactor: 2.5,
                    timesCorrect: 0,
                    timesMistaken: 0
                };
            }
        });
    });
}

/**
 * Load saved data from localStorage
 */
export function loadData(): void {
    try {
        const savedWords = localStorage.getItem(STORAGE_KEY);
        if (savedWords) {
            wordState = JSON.parse(savedWords);
        }

        const savedStats = localStorage.getItem(STATS_KEY);
        if (savedStats) {
            playerStats = { ...playerStats, ...JSON.parse(savedStats) };
        }

        initWordState();
        updateDailyStreak();
    } catch (e) {
        console.warn('Could not load data:', e);
        initWordState();
    }
}

/**
 * Save data to localStorage
 */
export function saveData(): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(wordState));
        localStorage.setItem(STATS_KEY, JSON.stringify(playerStats));
    } catch (e) {
        console.warn('Could not save data:', e);
    }
}

/**
 * Update daily streak
 */
function updateDailyStreak(): void {
    const today = getToday();
    const lastPlayed = playerStats.lastPlayedDate;

    if (!lastPlayed) {
        playerStats.dailyStreak = 0;
    } else if (lastPlayed === today) {
        // Already played today
    } else {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastPlayed !== yesterdayStr) {
            playerStats.dailyStreak = 0;
        }
    }
}

/**
 * Record that player practiced today
 */
export function recordPractice(): void {
    const today = getToday();
    if (playerStats.lastPlayedDate !== today) {
        playerStats.dailyStreak++;
        playerStats.lastPlayedDate = today;
        playerStats.totalSessions++;
        saveData();
        checkAchievements();
    }
}

/**
 * Get word's current state
 */
export function getWordState(term: string): WordState {
    return wordState[term] || { score: 0, interval: 0, nextReview: getToday(), easeFactor: 2.5, timesCorrect: 0, timesMistaken: 0 };
}

/**
 * Get word's mastery score
 */
export function getWordScore(term: string): number {
    return getWordState(term).score;
}

/**
 * Update word using SM-2 algorithm
 */
export function updateWordSRS(term: string, quality: number): void {
    const state = wordState[term];
    if (!state) return;

    state.easeFactor = Math.max(1.3, state.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

    if (quality < 3) {
        state.interval = 0;
        state.score = Math.max(0, state.score - 1);
        state.timesMistaken++;
    } else {
        if (state.interval === 0) {
            state.interval = 1;
        } else if (state.interval === 1) {
            state.interval = 6;
        } else {
            state.interval = Math.round(state.interval * state.easeFactor);
        }

        if (quality >= 4) {
            state.score = Math.min(5, state.score + 1);
        }
        state.timesCorrect++;

        if (state.score >= 4 && state.timesCorrect >= 3) {
            if (!playerStats.achievements.includes(`learned_${term}`)) {
                playerStats.wordsLearned++;
            }
        }

        if (quality === 5 && state.score === 5) {
            if (!playerStats.achievements.includes(`perfect_${term}`)) {
                playerStats.perfectWords++;
            }
        }
    }

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + state.interval);
    state.nextReview = nextDate.toISOString().split('T')[0];

    saveData();
}

// Extended word type for practice
export interface PracticeWord extends Word, Partial<WordState> { }

/**
 * Get all lessons
 */
export function getLessons(): Lesson[] {
    return LESSONS;
}

/**
 * Get current lesson
 */
export function getCurrentLesson(): Lesson {
    return LESSONS.find(l => l.id === playerStats.currentLessonId) || LESSONS[0];
}

/**
 * Set current lesson
 */
export function setCurrentLesson(lessonId: number): void {
    playerStats.currentLessonId = lessonId;
    saveData();
}

/**
 * Get lesson progress (0-1)
 */
export function getLessonProgress(lessonId: number): number {
    const lesson = LESSONS.find(l => l.id === lessonId);
    if (!lesson) return 0;

    let totalScore = 0;
    lesson.phrases.forEach(phrase => {
        totalScore += getWordScore(phrase.term);
    });

    return totalScore / (lesson.phrases.length * 5); // Max score is 5 per phrase
}

/**
 * Get words for practice from current lesson
 */
export function getWordsForPractice(): PracticeWord[] {
    const lesson = getCurrentLesson();
    const today = getToday();
    const dueWords: PracticeWord[] = [];
    const newWords: PracticeWord[] = [];

    lesson.phrases.forEach((phrase, index) => {
        const state = getWordState(phrase.term);
        const practiceWord: PracticeWord = {
            term: phrase.term,
            pinyin: phrase.pinyin,
            level: Math.ceil((index + 1) / 3),
            lessonId: lesson.id,
            ...state
        };

        if (state.nextReview <= today) {
            if (state.timesCorrect === 0) {
                newWords.push(practiceWord);
            } else {
                dueWords.push(practiceWord);
            }
        }
    });

    shuffle(dueWords);
    shuffle(newWords);

    // Allow selecting all available new words (count is limited in selectLesson)
    // const maxNewWords = 5; 
    const result = [...dueWords, ...newWords];

    // If nothing due, return weakest words
    if (result.length === 0) {
        const allWords: PracticeWord[] = lesson.phrases.map((phrase, index) => ({
            term: phrase.term,
            pinyin: phrase.pinyin,
            level: Math.ceil((index + 1) / 3),
            lessonId: lesson.id,
            ...getWordState(phrase.term)
        }));
        allWords.sort((a, b) => (a.score || 0) - (b.score || 0));
        return allWords.slice(0, 6);
    }

    return result;
}

/**
 * Get unmastered words from selected lessons (score < 5)
 */
export function getUnmasteredWords(lessonIds: number[]): PracticeWord[] {
    const result: PracticeWord[] = [];

    lessonIds.forEach(lessonId => {
        const lesson = LESSONS.find(l => l.id === lessonId);
        if (!lesson) return;

        lesson.phrases.forEach((phrase, index) => {
            const state = getWordState(phrase.term);
            // Only include words not yet mastered (score < 5)
            if (state.score < 5) {
                result.push({
                    term: phrase.term,
                    pinyin: phrase.pinyin,
                    level: Math.ceil((index + 1) / 3),
                    lessonId: lesson.id,
                    ...state
                });
            }
        });
    });

    // Sort by score (weakest first) then shuffle within same score
    result.sort((a, b) => (a.score || 0) - (b.score || 0));

    return result;
}

/**
 * Shuffle array in place
 */
function shuffle<T>(arr: T[]): void {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

/**
 * Get player stats
 */
export function getStats(): PlayerStats {
    return { ...playerStats };
}

/**
 * Add XP and check for level up
 */
export function addXP(amount: number): number {
    playerStats.totalXP += amount;
    saveData();
    checkAchievements();
    return playerStats.totalXP;
}

/**
 * Get player level from XP
 */
export function getLevel(): number {
    return Math.floor(Math.sqrt(playerStats.totalXP / 100)) + 1;
}

/**
 * Get XP needed for next level
 */
export function getXPForNextLevel(): number {
    const level = getLevel();
    return level * level * 100;
}

/**
 * Get XP progress to next level (0-1)
 */
export function getLevelProgress(): number {
    const currentLevel = getLevel();
    const currentLevelXP = (currentLevel - 1) * (currentLevel - 1) * 100;
    const nextLevelXP = currentLevel * currentLevel * 100;
    return (playerStats.totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP);
}

// Achievement definitions
const ACHIEVEMENTS: Achievement[] = [
    { id: 'first_word', name: '第一步', desc: '完成第一个词语', icon: '🎯', check: () => playerStats.totalSessions >= 1 },
    { id: 'streak_3', name: '连续三天', desc: '连续练习三天', icon: '🔥', check: () => playerStats.dailyStreak >= 3 },
    { id: 'streak_7', name: '一周勇士', desc: '连续练习七天', icon: '⚔️', check: () => playerStats.dailyStreak >= 7 },
    { id: 'streak_30', name: '月度大师', desc: '连续练习三十天', icon: '👑', check: () => playerStats.dailyStreak >= 30 },
    { id: 'level_5', name: '初学者', desc: '达到等级 5', icon: '⭐', check: () => getLevel() >= 5 },
    { id: 'level_10', name: '学习者', desc: '达到等级 10', icon: '🌟', check: () => getLevel() >= 10 },
    { id: 'learned_10', name: '词汇新手', desc: '学会 10 个词语', icon: '📚', check: () => playerStats.wordsLearned >= 10 },
    { id: 'learned_50', name: '词汇达人', desc: '学会 50 个词语', icon: '📖', check: () => playerStats.wordsLearned >= 50 },
    { id: 'learned_all', name: '词汇大师', desc: '学会所有 135 个词语', icon: '🏆', check: () => playerStats.wordsLearned >= 135 },
    { id: 'perfect_10', name: '完美主义', desc: '完美完成 10 个词语', icon: '💎', check: () => playerStats.perfectWords >= 10 },
    { id: 'xp_1000', name: '千分达人', desc: '获得 1000 经验', icon: '🎮', check: () => playerStats.totalXP >= 1000 },
    {
        id: 'lesson_complete', name: '完成一课', desc: '完成一课的所有词语', icon: '📝', check: () => {
            return LESSONS.some(lesson => getLessonProgress(lesson.id) >= 0.8);
        }
    },
];

/**
 * Check and unlock achievements
 */
export function checkAchievements(): Achievement[] {
    const newAchievements: Achievement[] = [];

    ACHIEVEMENTS.forEach(ach => {
        if (!playerStats.achievements.includes(ach.id) && ach.check()) {
            playerStats.achievements.push(ach.id);
            newAchievements.push(ach);
        }
    });

    if (newAchievements.length > 0) {
        saveData();
    }

    return newAchievements;
}

/**
 * Get all achievements with unlock status
 */
export function getAchievements(): (Achievement & { unlocked: boolean })[] {
    return ACHIEVEMENTS.map(ach => ({
        ...ach,
        unlocked: playerStats.achievements.includes(ach.id)
    }));
}

/**
 * Legacy compatibility
 */
export function loadScores(): void { loadData(); }
export function updateWordScore(term: string, delta: number): void {
    const quality = delta > 0 ? (delta >= 2 ? 5 : 4) : 2;
    updateWordSRS(term, quality);
}

/**
 * Log a practice attempt to localStorage
 */
export function logAttempt(attempt: AttemptLog): void {
    try {
        const logs = getAttemptLogs();
        logs.push(attempt);
        // Keep only last 100 attempts to avoid storage overflow
        if (logs.length > 100) {
            logs.splice(0, logs.length - 100);
        }
        localStorage.setItem(ATTEMPT_LOG_KEY, JSON.stringify(logs));
    } catch (e) {
        console.warn('Could not save attempt log:', e);
    }
}

/**
 * Get all attempt logs from localStorage
 */
export function getAttemptLogs(): AttemptLog[] {
    try {
        const saved = localStorage.getItem(ATTEMPT_LOG_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.warn('Could not load attempt logs:', e);
    }
    return [];
}

/**
 * Clear all attempt logs
 */
export function clearAttemptLogs(): void {
    try {
        localStorage.removeItem(ATTEMPT_LOG_KEY);
    } catch (e) {
        console.warn('Could not clear attempt logs:', e);
    }
}
