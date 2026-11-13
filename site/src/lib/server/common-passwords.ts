import "server-only";
/**
 * Passwords and password roots that people try first, in Norwegian and English: the most used passwords, keyboard
 * runs, common words, first names, places, clubs and brands, and the project's own names. A password is refused
 * when it is one of these, or one of these with digits or signs before or after it, with letters swapped for
 * look-alike digits ("p4ssw0rd"), or repeated ("hemmelighemmelig"). So "Passord2026", "Password1!", "knotten2026"
 * and "qwerty12345" are all refused, while a sentence of ordinary words is not.
 */
const TOP = `
password passwort passwd passord passordet passordmitt mittpassord nyttpassord hemmelig hemmelighet secret secrets
qwerty qwertz azerty qwertyu qwertyui qwertyuiop qwertyuiopå asdf asdfg asdfgh asdfghj asdfghjk asdfghjkl asdfghjklø
asdfghjkløæ zxcv zxcvb zxcvbn zxcvbnm qaz qazwsx qazwsxedc qweasd qweasdzxc qwe qweqwe asd asdasd zxc zxczxc
poiuytrewq lkjhgfdsa mnbvcxz ytrewq abc abcd abcde abcdef abcdefg abcdefgh abcdefghi abcdefghij abcabc aaa aaaa
iloveyou iloveu ilovey loveyou loveu letmein letmeinnow welcome welcomeback welcomehome admin administrator adminadmin
root toor user username guest test testtest tester testing testuser demo login logon logmein signin access accessdenied
changeme default nopassword nopass blank empty temp temporary pass passpass mypass mypassword yourpassword
master monkey dragon sunshine princess shadow superman batman spiderman ironman wolverine hulk thor loki avengers
football baseball basketball soccer hockey tennis golf golfer cricket rugby boxing wrestling fighter champion winner
michael jennifer jordan hunter ranger buster tigger charlie andrew thomas robert daniel jessica ashley amanda george
harley hannah maggie summer winter spring autumn freedom whatever trustno trustnoone nothing anything everything
cheese cookie cookies pepper ginger chocolate banana orange apple lemon cherry peanut butter flower flowers rainbow
butterfly computer internet killer matrix starwars startrek pokemon pikachu naruto minecraft fortnite roblox
playstation xbox nintendo mario zelda sonic yankees lakers cowboys steelers eagles packers redsox liverpool arsenal
chelsea manchester manutd barcelona realmadrid juventus bayern madrid london paris berlin america canada mexico
england france germany italy spain sweden norway denmark finland iceland poland russia china japan india brazil
africa australia texas florida california boston chicago dallas miami vegas newyork hollywood
love lover loving lovely loveme lovers lovelove kisses kiss baby babygirl babyboy babe angel angels angelina devil
god jesus christ heaven hell faith hope grace blessed blessing trinity mother father family friend friends
friendship sister brother daughter husband wife darling sweetheart sweetie honey sugar candy beautiful pretty
gorgeous sexy sexylady hottie hotstuff handsome happy happiness smile smiley lucky luck fortune money dollar dollars
cash rich million billion diamond diamonds gold golden silver platinum crystal ruby emerald pearl jade star stars
superstar rockstar music musica guitar piano drums rock metal punk jazz blues hiphop rap dance dancer dancing singer
forever always never someone nobody somebody hello hellokitty kitty kitten cat cats dog dogs puppy puppies doggy doggie
horse horses pony unicorn tiger tigers lion lions bear bears wolf wolves fox eagle falcon hawk raven phoenix shark
dolphin whale turtle snake cobra viper python spider scorpion panther jaguar leopard cheetah zebra gorilla elephant
rabbit bunny mouse hamster turkey chicken duck goose penguin parrot owl bird birdie fish fishing hunting camping
hiking biking skate skater skating surfer surfing snowboard skiing runner running
red blue green yellow purple pink black white brown grey gray violet indigo crimson scarlet
sunset sunrise moon moonlight starlight midnight morning evening night darkness light thunder lightning storm rain
snow ice fire water earth wind ocean sea beach island mountain mountains river lake forest tree trees garden rose
roses lily daisy tulip jasmine magnolia orchid sunflower
ferrari porsche mercedes benz bmw audi volvo saab toyota honda nissan mazda subaru ford chevy chevrolet dodge jeep
tesla corvette mustang camaro ducati yamaha suzuki kawasaki volkswagen skoda peugeot renault citroen
google facebook twitter instagram youtube snapchat tiktok microsoft windows linux android iphone samsung nokia sony
dell intel cisco oracle hacker hacked hacking system server network database manager office company business
service support security private public internet website online offline email mail mobile phone
monday tuesday wednesday thursday friday saturday sunday january february march april may june july august
september october november december
qwerty qwertyqwerty qwer qwerasdf qwertasdfg asdfqwer zaqxsw zaqwsx xswzaq
superman batman joker gandalf frodo hobbit harrypotter hogwarts hermione voldemort sherlock dexter simpsons homer
bart scooby snoopy garfield mickey minnie donald goofy disney barbie elmo yoda vader skywalker jedi chewbacca
whatever whatsup wassup yolo swag swagger boss bigboss bigdaddy daddy mommy mama papa
fuckyou fuckoff fuck shit bitch asshole bastard penis pussy dick cock blowjob porn porno
`;

const EN_NAMES = `
michael christopher matthew joshua daniel david james robert john joseph andrew ryan brandon jason justin william
jonathan brian nicholas anthony eric kevin steven thomas timothy richard jeremy jeffrey kyle mark benjamin aaron
charles adam scott paul sean nathan patrick zachary stephen gregory kenneth dustin peter samuel travis bradley
alexander jacob tyler austin dylan cody ethan noah logan lucas mason liam oliver elijah henry jack leo max oscar
alfie archie harry freddie theo arthur jessica ashley sarah emily elizabeth megan lauren stephanie nicole heather
melissa rachel samantha michelle amber danielle rebecca brittany kayla courtney katherine christina amy laura
kimberly olivia emma sophia isabella ava mia abigail madison chloe grace lily natalie victoria anna maria alexis
taylor brianna alyssa kelly kelsey morgan jasmine tiffany vanessa andrea erica crystal monica angela julia diana
linda barbara susan karen nancy lisa betty helen sandra donna carol ruth sharon dorothy margaret patricia mary
jacqueline catherine caroline charlotte sophie lucy molly ellie holly poppy daisy rosie ruby evie isla freya
william harrison edward frederick louis hugo felix finn sebastian toby jake luke matt matthew chris tom tommy
johnny jimmy bobby billy danny freddy teddy eddie frank frankie sam sammy alex alexa alice amelia ella emma
`;

const NO_WORDS = `
passord hemmelig hemmeligheter kode koden pinkode bankkode innlogging logginn loggin palogging pålogging brukernavn
bruker brukeren admin tester testing proeve prøve velkommen hei heisann hallo hade hadebra takk tusentakk ja nei
kanskje alltid aldri ingenting noe alt
sommer sommeren sommerferie vinter vinteren vinterferie host høst høsten var vår våren jul julen julaften
julenisse nissen pase påske påsken sankthans
fotball fotballen handball håndball basket volleyball tennis golf ski skiing skiløping langrenn hopp alpint
skoyter skøyter sykkel sykling loping løping jogging trening treningen styrke bading svomming svømming fiske fisking
jakt jakten hytta hytte hytteliv bat båt båten seilbat seilbåt seiling fjell fjellet fjelltur skog skogen skogtur
sjo sjø sjoen sjøen hav havet fjord fjorden strand stranden sol solen sola solskinn mane måne månen stjerne
stjerner stjernen himmel himmelen regn regnet sno snø snoen snøen vind vinden storm uvaer uvær torden lyn regnbue
blomst blomster blomsten rose roser tulipan lovetann løvetann bjork bjørk furu gran eik lonn lønn
kjaerlighet kjærlighet kjaereste kjæreste kjæresten elskling elsker elskerdeg jegelskerdeg elskedeg jegelskdeg
glad glede lykke lykkelig smil smilet hjerte hjertet venn vennen venner venninne venninner familie familien
mamma pappa mor mora far faren bror broren sost søster søsteren sonn sønn sønnen datter datteren bestemor
bestefar farmor farfar mormor morfar onkel tante baby babyen jente jenta gutt gutten prinsesse prinsessa prins
konge kongen dronning dronningen drage dragen engel engelen djevel djevelen gud jesus kirke himmelrike
katt katten katter pus pusen pusekatt hund hunden bikkje bikkja valp valpen hest hesten hester ponni ku kua gris
grisen sau sauen geit hone høne hane kylling and gas gås fugl fuglen orn ørn falk ugle krake kråke make måke ulv
ulven bjorn bjørn bjørnen rev reven elg elgen hjort radyr rådyr reinsdyr rein hare kanin mus rotte ekorn pinnsvin
love løve tiger elefant ape apekatt sjiraff sebra krokodille slange edderkopp fisk laks orret ørret torsk hval
delfin hai sel pingvin papegoye papegøye marsvin hamster
pizza taco kebab burger polse pølse polser pølser vaffel vafler sjokolade sukker godteri iskrem kake kaker bolle
boller brus cola kaffe te øl ol vin melk ost brod brød smor smør syltetoy syltetøy jordbaer jordbær blabaer blåbær
bringebaer bringebær multe multer eple epler banan appelsin paere pære drue druer sitron tomat potet poteter gulrot
taco fredagstaco brunost lefse lutefisk pinnekjott pinnekjøtt ribbe kjottkaker kjøttkaker
mandag tirsdag onsdag torsdag fredag lordag lørdag sondag søndag helg helgen januar februar mars april mai juni
juli august september oktober november desember
datamaskin datamaskinen pc data internett nettside nettbank bank bankid vipps penger rik rikdom gull solv sølv
diamant superstjerne musikk gitar trommer dans danser sang sanger rockestjerne
skole skolen jobb jobben arbeid kontor kontoret sjef sjefen firma firmaet hjem hjemme huset hus leilighet
bil bilen motorsykkel moped traktor tog fly flyet buss
norsk norge noreg nordmann nordmenn viking vikinger
rodt rødt rod rød blatt blått bla blå gronn grønn gront grønt gul gult svart hvit hvitt rosa lilla oransje brun grå gra
tusen million milliard hundre
`;

const NO_NAMES = `
ola kari per pal pål espen nils jon hans lars ole knut arne bjorn bjørn eirik erik geir gunnar harald ivar jan
jens kjell magnus martin morten odd olav rune sigurd stein sverre terje tor trond vidar anders andreas aleksander
kristian christian kristoffer christoffer fredrik henrik jonas emil mathias markus sander sebastian simon tobias
jakob filip isak elias johannes sindre vegard torbjorn torbjørn tom tommy stian steinar svein sven roar roger
rolf petter haakon håkon hakon halvor helge inge jarle jostein kai karl kim kjetil kare kåre leif magne nicolai
oddvar oskar ove reidar runar sondre stale ståle tarjei tord trygve ulrik vebjorn vebjørn einar eivind even
gaute gard gjermund hallvard hermann ingvar jorgen jørgen kenneth kristen lasse marius mats mikkel nikolai
ole olav olaf ottar preben ragnar remi robin rasmus sigve simonsen snorre sturla sveinung thorleif torgeir torstein
anne astrid berit ellen gro hanne hilde ingrid inger kristin liv marit nina randi silje siri solveig sonja tone
tove trine turid unni wenche ida ingeborg ingvild karin kristine linn line lise lisbeth mette nora sara sofie sofia
ella maja leah frida hedda thea tiril vilde aurora selma amalie camilla cecilie charlotte elin elisabeth eva guro
hege heidi helene henriette irene janne johanne julie june kaja karoline kjersti kristina lena lene linda live
malin marte martine mona oda ragnhild rikke ronja sanna sigrid sissel stine susanne therese tonje torill tuva
vibeke vigdis yvonne åse aase ase eli else gerd grete gunn gunhild jorunn kirsten laila marianne merete oddny
reidun sigrun solvi sølvi synnove synnøve torunn emilie ingrid mathilde marthe hedvig iselin kamilla
`;

const PLACES = `
norge norway oslo bergen trondheim stavanger kristiansand drammen fredrikstad tromso tromsø bodo bodø alesund
ålesund aalesund haugesund sandnes sarpsborg skien porsgrunn arendal tonsberg tønsberg moss hamar larvik halden
lillehammer molde harstad gjovik gjøvik kongsberg sandefjord horten steinkjer namsos narvik alta hammerfest
kirkenes vadso vadsø mandal lindesnes vigeland farsund flekkefjord lyngdal kvinesdal grimstad lillesand risor risør
tvedestrand vennesla songdalen sogne søgne marnardal audnedal agder vestagder austagder sorlandet sørlandet
vestlandet ostlandet østlandet nordnorge nordland finnmark troms trondelag trøndelag rogaland hordaland vestland
telemark vestfold ostfold østfold akershus buskerud oppland hedmark innlandet viken lofoten senja geiranger
preikestolen nordkapp galdhopiggen galdhøpiggen jotunheimen hardanger sognefjord svalbard
knotten rodberg rødberg raudberg sniksfjorden snigsfjorden audna lokkeheia løkkeheia sigvesimonsen boligfelt
bolig boliger tomt tomter tomta energi solcelle solceller batteri varmepumpe
stockholm goteborg göteborg copenhagen kobenhavn københavn helsinki reykjavik amsterdam rome roma barcelona
`;

const CLUBS = `
rosenborg brann valerenga vålerenga molde viking start ikstart lyn lillestrom lillestrøm bodoglimt bodøglimt glimt
tromso odd stromsgodset strømsgodset sarpsborg haugesund aalesund kristiansund sandefjord stabaek stabæk hamkam
mjondalen mjøndalen jerv rbk vif lsk fkh
equinor statoil telenor telia dnb nordea posten rema kiwi meny spar coop obs elkjop elkjøp ikea finn
`;

const EN_MORE = `
ihateyou imissyou iloveyoutoo loveyoutoo thankyou thanks goodluck goodbye goodnight goodmorning goodday goodgirl
goodboy goodlife goodtimes happybirthday birthday happydays happyday mylove myself mybaby mylife mygirl myboy mydog
mycat myhome mymoney mysecret mymom mydad mykids myname mypassword mycomputer myworld myspace myfamily mybestfriend
bestfriend bestfriends besties bff soulmate sweetlove truelove firstlove onelove onlyyou foreveryoung forevermore
lovelife lifeisgood lifestyle livelife liveforever carpediem nevergiveup believe believer dreamer dreams dream
imagine destiny miracle magic magical mystery secretlove whisper shadowman nightmare zombie vampire werewolf ghost
monster demon angelface babyface sunshine sunflower moonshine starshine superstar shootingstar galaxy universe
planet jupiter saturn mercury venus mars pluto neptune apollo orion cosmos rocket spaceman astronaut
warrior soldier knight samurai ninja pirate captain sailor viking legend legends hero heroes villain wizard witch
king queen prince kingdom castle empire emperor general sergeant major colonel
password1 passwords mypass secure security protect protected safety safe lock locked unlock key keys keyboard
mouse monitor laptop desktop tablet camera printer router modem server servers backup recovery reset restart
summertime wintertime springtime holiday holidays vacation weekend party partytime fiesta celebrate cheers
coffee espresso cappuccino latte tea beer wine vodka whiskey whisky tequila rum martini cocktail
pizza burger hotdog pasta spaghetti lasagna sushi taco tacos nachos burrito donut donuts cupcake muffin pancake
waffle bacon sausage steak potato tomato carrot pumpkin strawberry blueberry raspberry blackberry pineapple mango
peach melon watermelon kiwi coconut cinnamon vanilla caramel honeybee sweetpea
alpha beta gamma delta omega sigma theta zeta epsilon lambda
one two three four five six seven eight nine ten eleven twelve hundred thousand zero
first second third last final number numbers digit counter
football1 soccerball goalkeeper striker defender midfielder quarterback touchdown homerun slamdunk
nfl nba nhl mlb fifa uefa espn
patriots giants jets dolphins bills ravens bengals browns texans colts jaguars titans broncos chiefs raiders
chargers bears lions vikings saints falcons panthers buccaneers cardinals rams seahawks niners redskins commanders
celtics knicks nets sixers raptors bulls cavaliers pistons pacers bucks hawks heat magic wizards hornets nuggets
timberwolves thunder blazers jazz warriors clippers suns kings mavericks rockets grizzlies pelicans spurs
tottenham everton newcastle westham leicester aston villa wolves brighton southampton leeds celtic rangers
acmilan inter intermilan napoli roma lazio ajax psv porto benfica dortmund schalke
metallica nirvana beatles queen eminem rihanna beyonce madonna michaeljackson elvis bonjovi acdc ledzeppelin
pinkfloyd slipknot linkinpark greenday coldplay oasis radiohead u2 abba aha
titanic avatar matrix terminator rambo rocky gladiator godfather scarface transformers jurassic batmanbegins
superman1 spongebob patrick pokemon1 digimon dragonball goku vegeta sasuke sakura hinata onepiece luffy bleach
fortnite1 callofduty halo warcraft starcraft diablo overwatch valorant league leagueoflegends counterstrike csgo
gamer gaming player playboy playgirl
qwertyqwerty asdfasdf zxcvzxcv qweqweqwe asdasdasd
blessed1 jesus1 jesuschrist jesusislord godisgood godbless amen hallelujah praise lord savior christian church
bible prayer heavenly holy spirit soul
america1 usa unitedstates britain greatbritain scotland ireland wales europe asia
newjersey pennsylvania virginia carolina georgia tennessee kentucky ohio michigan illinois wisconsin minnesota
iowa missouri kansas nebraska oklahoma arizona nevada utah colorado oregon washington alaska hawaii
toronto vancouver montreal sydney melbourne dublin glasgow manchester liverpool birmingham
rangers1 united city
password0 secret1 letmein1 welcome1 hello1 admin1 master1 monkey1 dragon1 sunshine1 princess1 shadow1
`;

const NO_MORE = `
glademeg hadetbra hadebra godnatt godmorgen goddag godkveld gratulerer hurra takkskaldufå detergodt livetergodt
minkjaereste minkjæreste mittliv minfamilie minbil minhund minkatt mitthjem minmamma minpappa barna ungene
minejenter minegutter minelskede elskede elsket kjaere kjære snuppa snuppen skatt skatten skattemann gullet
gullungen gullklump vennen min hjertevenn bestevenn bestevenner bestevenninne kompis kompisen kamerat
fotballgal fotballspiller keeper spiss forsvar landslaget norgesmester verdensmester mester mesteren vinner
vinneren konge kongen kongeriket fedreland norgesflagg flagget syttendemai nasjonaldag grunnlov
jentene guttene ungdom barndom gammel ung ny nytt gammelt stor liten lille store
hjemmet hjemmekontor hagen hage terrassen terrasse garasje kjeller loft stue kjokken kjøkken soverom bad badet
fjellet tinden toppen dalen elva elv innsjo innsjø vann vannet bekken fossen foss isbre bre
nordlys midnattsol morgensol kveldssol solnedgang soloppgang varme kulde frost tåke take
skiferie skitur fjelltur sykkeltur gåtur gatur turer turen reise reisen ferie ferien helgetur
fiskestang fiskebat fiskebåt sjark snekke kano kajakk robat robåt seilas
traktoren gården garden bonde bonden fjos fjøs låve lave stabbur seter setra
ulven1 rosenborg1 brann1 viking1 norge1 oslo1 bergen1 sommer1 vinter1 hemmelig1 passord1
melkesjokolade kvikklunsj firkløver smash potetgull pommes pommesfrites
brunosten hvitost gulost fårikål fårikal raspeballer komle kumle klubb rakfisk rakorret surkål
kanelbolle kanelboller skolebolle skoleboller lomper lompe pølsebrød polsebrod
akevitt pils pilsner ringnes hansa mack aass dahls frydenlund
nrk tv2 vg dagbladet aftenposten
mammaogpappa pappaogmamma mammamia
datamaskin1 nettverk ruter modem skjerm tastatur mus musa
sjef sjefen direktor direktør leder lederen styret ansatt ansatte kunde kunder
kristendom kristus herren frelser bønn bonn kirken kirkegarden
nisse nissefar nissemor julestjerne juletre julegave gaver gave pepperkake pepperkaker
sommerhus sommerdag sommernatt vinterdag vinternatt vinterland sommerland eventyr eventyrland troll trollet
hulder askeladden kvitebjørn kvitebjorn veslefrikk soria moria
`;

const WORDS_MORE = `
airplane airport anchor animal answer apple1 april1 arrow artist august1 baby1 bacon1 badboy badgirl balloon
banana1 bandit banker barney basket beaches beauty bedroom benjamin1 bigdog bigfoot bigmac bingo biscuit blackcat
blackjack blacky blade blaster blazer blonde blondie bluebird blueberry1 blueeyes bluesky bobcat bonita bonjour
boomer booster bowling boxer brandy bravo bridge broken brooklyn bubbles buddy buffalo bulldog bullet bullseye
bunny1 cactus cadillac calvin camera1 candle canyon capital capricorn carbon cardinal carlos carmen carrot
cartoon casino casper castle1 catalina catdog cavalier celica center chance changeit chaos charger charlie1 chaser
cheater cheetah1 chester chevy1 chicago1 chicken1 chief chiefs1 children chilli chocolat christmas cinderella circle
claire classic cleopatra clever climber clover coach cobra1 coffee1 college cometo compaq condor connect contact
cooper copper corona cougar country cowboy cowgirl coyote crazy creative cricket1 crimson1 cross crown crusader
crystal1 cupcake1 custom cutie cyborg dakota dallas1 dancer1 danger darkness1 dashboard dawson december1 delta1
denver desert design destroy detroit diablo1 diamond1 diesel digger dinosaur director disco doctor dodgers dollar1
dolphins1 domino doodle dragons dreamcatcher driver dublin1 eagles1 eclipse edward1 element elephant1 elvis1
emerald1 energy enigma enjoy escape eternity europe1 evolution explorer express falcon1 fantasy farmer fashion
fender ferrari1 fighter1 firebird fireman firefly fisher flamingo flash flight flipper florida1 flower1 flyer
forest1 formula fountain france1 franklin freaky freedom1 friday1 frog frosty fucker fuckme funny gadget galaxy1
gamecube garden1 gateway gemini genesis genius george1 gibson giggles ginger1 giraffe glitter global goblin
goddess godzilla goldfish golfball gonzo gopher gordon gotcha graphic gremlin griffin grizzly guardian guitar1
gundam gunner hacker1 halloween hamburger hammer hannibal happy1 harmony harvard hawaii1 hawkeye heather1 heaven1
helicopter hello123 helpme hercules hermes hiphop1 history hobbes holiday1 homerun1 honda1 hooters hornet horses1
hotdog1 hotrod houston hummer hunter1 hurricane iceman icecream indian indigo1 inferno infinity insane inside
island1 jackass jackie jackpot jaguar1 jamaica january1 japan1 jasper jeffrey1 jersey jester jupiter1 justice
kansas karate katana keeper kenwood killer1 kingdom1 kingkong kitten1 knight1 kodiak lacrosse ladybug lakers1
lambert lancer laptop1 laser legend1 legolas liberty lightning1 lincoln liverpool1 lizard lobster london1 lonely
lookout loser lovebug lucky1 lucky7 lunatic madness maestro magnum mailman malibu mandarin maple marathon
marine marlboro marvel matador maverick maximus maxwell meatball mechanic medusa melody memphis mercedes1 mercury1
merlin mermaid metallic mexico1 mickey1 midnight1 mike millenium miller mirage mistress mobile1 monday1 money1
monica1 monopoly monster1 montana moonbeam morpheus mother1 motorola mountain1 movie mozart muffin1 murphy
mustang1 nascar natasha nathan1 nature navy nemesis neptune1 newport nicole1 nightmare1 nike nirvana1 nissan1
nobody1 norton nothing1 nugget october1 olympus omega1 online1 orange1 orlando outlaw oxford pacific pakistan
panama panda pandora panther1 papillon paradise parker passion password12 patches patriot peaches peanut1
pegasus pencil penguin1 pepsi perfect phantom philip phoenix1 photo picasso pickle pierre piglet pimp pirate1
pizza1 platinum1 player1 please pluto1 poison polaris police popcorn popeye porsche1 power powers predator
prelude pretty1 prince1 princesa prophet psycho puma pumpkin1 punisher purple1 qwerty1 rabbit1 racecar raider
raiders1 rainbow1 rambo1 random ranger1 rascal redwing reggae renegade republic rescue revenge revolution rhino
richard1 ricky river1 roadrunner robin1 robot rocket1 rocky1 rodeo romance romeo rooster royal rugby1 russia1
sabrina sailor1 salmon samson samsung1 sandman santa sapphire saturn1 savage scarlet1 school science scooby1
scooter scorpio scorpion1 scotch scout scrappy seattle secret12 senator sergio service1 shadow12 shannon shark1
sheriff shooter silver1 simple skippy skywalker1 slayer slipknot1 smokey snickers sniper snoopy1 snowball
snowman soccer1 solomon sonic1 sophie1 sparky spartan speedy spencer spider1 spirit1 spitfire sports spring1
spyder squirrel stalker stanley startrek1 stealth steelers1 sterling stinger stingray storm1 strider student
studio stupid sublime success sugar1 summer1 sunday sunrise1 super surfer1 sweet sweety swimming sydney1
symbol tarzan tattoo taurus teacher teddybear temple tennis1 texas1 theater thunder1 thunderbird tiffany1 timber
titan titanic1 tomcat topgun tornado toyota1 tractor trinity1 trojan trouble trucker trumpet tucker turbo twilight
twister ultimate unicorn1 universal valentine vampire1 vanilla1 velvet venom victory viking1 vintage viper1
virgin virus voodoo voyager walrus wanker warlock warrior1 water1 webmaster wedding welcome12 western whatever1
whiskey1 white1 wildcat william1 willow wilson winner1 winston winter1 wizard1 wolfman wolverine1 wombat
wonder woody xavier yankee yellow1 yoda1 zombie1 zxcvbnm1
`;

/** Whole passwords made of keyboard and digit runs; checked as typed (lower case). */
const RUNS = `
1234567890 0987654321 0123456789 9876543210 1234512345 1122334455 1029384756 1qaz2wsx3edc 1q2w3e4r5t 1q2w3e4r5t6y
1a2b3c4d5e q1w2e3r4t5 q1w2e3r4t5y6 zaq12wsx zaq1xsw2 147258369 1472583690 7531592468 123qweasd 123qweasdzxc
qwe123asd qweasd123 asd123zxc qwerty1234 qwerty12345 qwerty123456 password123 password1234 passord123 passord1234
abc1234567 abcd123456 123abc123abc 1qazxsw2 1qaz2wsx 2wsx3edc 1q2w3e4r 1q2w3e 123456789a a123456789 a1b2c3d4e5
`;

const ALL = [TOP, EN_NAMES, EN_MORE, WORDS_MORE, NO_WORDS, NO_MORE, NO_NAMES, PLACES, CLUBS, RUNS].join(" ");
export const COMMON_PASSWORDS: ReadonlySet<string> = new Set(ALL.split(/\s+/).filter(Boolean));

const LEET: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b", "@": "a", $: "s", "!": "i", "+": "t" };
const deleet = (s: string) => s.replace(/[0134578@$!+]/g, (c) => LEET[c] ?? c);
const bare = (s: string) => s.replace(/[\s._\-,;:*'"/\\|]+/g, "");
/** Digits and signs at the start and the end, the usual decoration around a common word. */
const core = (s: string) => s.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, "");

function known(x: string) {
  if (!x) return false;
  if (COMMON_PASSWORDS.has(x)) return true;
  // the same word over and over ("passordpassord")
  const unit = /^(.+?)\1+$/u.exec(x)?.[1];
  return !!unit && unit.length >= 3 && COMMON_PASSWORDS.has(unit);
}

/** Only digits and signs: a run, a repeated block or very few different characters. */
function weakRun(s: string) {
  if (/\p{L}/u.test(s)) return false;
  if (/^(.{1,5})\1+.{0,4}$/u.test(s)) return true;
  if (new Set(s).size <= 3) return true;
  const d = s.replace(/\D/g, "");
  if (d.length === s.length && d.length >= 6) {
    const steps = new Set(Array.from(d).slice(1).map((c, i) => (Number(c) - Number(d[i]) + 10) % 10));
    if (steps.size === 1) return true;
  }
  return false;
}

/** True when the password is one of the first that anyone guessing would try. */
export function isCommonPassword(pw: string) {
  const s = pw.normalize("NFKC").toLowerCase();
  if (COMMON_PASSWORDS.has(s) || COMMON_PASSWORDS.has(bare(s))) return true;
  if (weakRun(s)) return true;
  const c = core(s);
  return [c, deleet(c), bare(c), deleet(bare(c)), core(deleet(s)), core(deleet(bare(s)))].some(known);
}
