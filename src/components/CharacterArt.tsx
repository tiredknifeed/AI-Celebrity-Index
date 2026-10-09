import type { ReactNode } from "react";
import type { Art, CreatureArt, HumanArt } from "@/data/portraits";

// Flat "sticker" illustrations. Each figure is drawn twice: a thick white
// outline pass of its silhouette, then the inked figure on top.

const INK = "#151515";
const W = 400;
const H = 480;

interface Figure {
  silhouette: ReactNode;
  details: ReactNode;
}

function Sticker({ figure, className, title }: { figure: Figure; className?: string; title: string }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} role="img" aria-label={title} preserveAspectRatio="xMidYMax meet">
      <g fill="#fff" stroke="#fff" strokeWidth={26} strokeLinejoin="round" strokeLinecap="round">
        {figure.silhouette}
      </g>
      <g stroke={INK} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round">
        {figure.silhouette}
        {figure.details}
      </g>
    </svg>
  );
}

// ------------------------------------------------------------------ humans

const SHOULDERS = "M28 480 C38 404 104 372 158 362 L242 362 C296 372 362 404 372 480 Z";
const SHOULDERS_MUSCLE = "M-6 480 C2 380 70 326 150 318 L250 318 C330 326 398 380 406 480 Z";

function backHair(h: HumanArt): ReactNode {
  const c = h.hair.color;
  switch (h.hair.style) {
    case "emo":
      return <path d="M114 196 C100 270 108 330 136 356 L264 356 C292 330 300 270 286 196 Z" fill={c} />;
    case "long":
      return <path d="M120 186 C98 290 100 380 118 430 L282 430 C300 380 302 290 280 186 Z" fill={c} />;
    case "buns":
      return (
        <>
          <circle cx={146} cy={112} r={34} fill={c} />
          <circle cx={254} cy={112} r={34} fill={c} />
        </>
      );
    case "updo":
      return (
        <>
          <circle cx={200} cy={96} r={58} fill={c} />
          <circle cx={146} cy={122} r={42} fill={c} />
          <circle cx={254} cy={122} r={42} fill={c} />
        </>
      );
    default:
      return null;
  }
}

function frontHair(h: HumanArt): ReactNode {
  const c = h.hair.color;
  switch (h.hair.style) {
    case "bowl":
      return (
        <path
          d="M122 212 C116 124 158 98 200 98 C242 98 284 124 278 212 L268 214 C266 186 260 176 248 172 L152 172 C140 176 134 186 132 214 Z"
          fill={c}
        />
      );
    case "bob":
      return (
        <path
          d="M200 96 C140 96 116 140 118 200 C116 240 100 270 94 292 C118 302 140 298 150 286 C140 258 136 220 140 172 L260 172 C264 220 260 258 250 286 C260 298 282 302 306 292 C300 270 284 240 282 200 C284 140 260 96 200 96 Z"
          fill={c}
        />
      );
    case "pageboy":
      return (
        <path
          d="M200 98 C142 98 116 140 118 196 L116 262 C126 272 142 274 152 266 L146 174 L254 174 L248 266 C258 274 274 272 284 262 L282 196 C284 140 258 98 200 98 Z"
          fill={c}
        />
      );
    case "emo":
      return (
        <>
          <path
            d="M200 94 C128 94 106 150 116 232 C120 252 128 262 136 266 C140 240 150 222 168 212 C200 226 240 224 264 210 C272 228 276 248 280 258 C292 200 292 120 200 94 Z"
            fill={c}
          />
          <path d="M132 150 C176 168 232 204 274 240 C252 244 220 236 190 224 C166 214 146 200 136 188 Z" fill={c} />
          <path d="M176 120 C150 140 140 170 146 206 L170 170 Z" fill={c} />
        </>
      );
    case "buns":
      return (
        <>
          <path
            d="M124 204 C118 132 158 104 200 104 C242 104 282 132 276 204 C268 172 250 152 200 150 C150 152 132 172 124 204 Z"
            fill={c}
          />
          <path d="M200 106 L200 150" fill="none" strokeWidth={3} />
        </>
      );
    case "updo":
      return (
        <path
          d="M124 204 C116 140 150 112 200 112 C250 112 284 140 276 204 C266 176 246 160 222 162 C212 150 188 150 178 162 C154 160 134 176 124 204 Z"
          fill={c}
        />
      );
    case "long":
      return (
        <path
          d="M124 212 C116 132 158 102 205 102 C252 102 286 136 278 216 C270 172 240 142 200 150 C170 156 140 180 124 212 Z"
          fill={c}
        />
      );
    case "pinkbob":
      return (
        <path
          d="M200 98 C140 98 114 140 116 200 L114 286 L152 286 L146 176 L254 176 L248 286 L286 286 L284 200 C286 140 260 98 200 98 Z"
          fill={c}
        />
      );
    case "short":
      return (
        <path
          d="M128 196 C124 130 162 108 200 108 C238 108 276 130 272 196 C262 160 240 144 200 144 C160 144 138 160 128 196 Z"
          fill={c}
        />
      );
    case "slick":
      return (
        <>
          <path
            d="M124 196 C112 120 148 80 212 80 C266 80 292 118 276 196 C268 152 250 136 222 140 C190 126 150 140 124 196 Z"
            fill={c}
          />
          <path d="M128 200 L132 240 L140 238 L138 196 Z" fill={c} />
          <path d="M272 200 L268 240 L260 238 L262 196 Z" fill={c} />
        </>
      );
  }
}

function outfit(h: HumanArt): { body: ReactNode; detail: ReactNode } {
  const o = h.outfit;
  const muscle = h.body === "muscle";
  const shoulders = muscle ? SHOULDERS_MUSCLE : SHOULDERS;
  switch (o.style) {
    case "suit":
      return {
        body: <path d={shoulders} fill={o.color} />,
        detail: (
          <>
            <path d="M168 362 L200 432 L232 362 Z" fill="#FBFAF6" />
            <path d="M168 362 L146 382 L198 474 L200 432 Z" fill={o.color} />
            <path d="M232 362 L254 382 L202 474 L200 432 Z" fill={o.color} />
            <path d="M192 372 L208 372 L213 390 L205 462 L195 462 L187 390 Z" fill={o.accent ?? INK} />
          </>
        ),
      };
    case "thobe":
      return {
        body: <path d={shoulders} fill={o.color} />,
        detail: (
          <>
            <path d="M170 364 Q200 384 230 364" fill="none" />
            <path d="M200 380 L200 480" fill="none" strokeWidth={4} />
            <circle cx={200} cy={404} r={3.5} fill={INK} />
            <circle cx={200} cy={430} r={3.5} fill={INK} />
          </>
        ),
      };
    case "tank":
      return {
        body: <path d={shoulders} fill={h.skin} />,
        detail: muscle ? (
          <>
            <path d="M118 480 C122 420 132 380 150 340 L170 340 C176 380 224 380 230 340 L250 340 C268 380 278 420 282 480 Z" fill={o.color} />
            <path d="M152 340 L170 340 C176 384 224 384 230 340 L248 340" fill="none" stroke={o.accent ?? INK} strokeWidth={7} />
            <path d="M208 400 L182 444 L200 444 L192 478 L224 428 L205 428 L216 400 Z" fill={o.accent ?? INK} strokeWidth={3} />
            <path d="M60 420 C80 392 100 384 118 392" fill="none" strokeWidth={4} />
            <path d="M340 420 C320 392 300 384 282 392" fill="none" strokeWidth={4} />
          </>
        ) : (
          <>
            <path d="M120 480 C124 430 138 392 156 366 L172 366 C178 396 222 396 228 366 L244 366 C262 392 276 430 280 480 Z" fill={o.color} />
            <path d="M156 366 L172 366 C178 398 222 398 228 366 L244 366" fill="none" stroke={o.accent ?? INK} strokeWidth={6} />
          </>
        ),
      };
    case "tee":
      return {
        body: <path d={shoulders} fill={o.color} />,
        detail: <path d="M164 364 C176 392 224 392 236 364" fill="none" />,
      };
    case "hoodie":
      return {
        body: <path d={shoulders} fill={o.color} />,
        detail: (
          <>
            <path d="M150 366 C160 410 240 410 250 366" fill="none" strokeWidth={6} />
            <path d="M184 396 L182 446 M216 396 L218 446" fill="none" />
          </>
        ),
      };
    case "blouse":
    default:
      return {
        body: <path d={shoulders} fill={o.color} />,
        detail: <path d="M160 364 C170 412 230 412 240 364 Z" fill={h.skin} />,
      };
  }
}

function eyes(h: HumanArt): ReactNode {
  if (h.eyes === "hidden") {
    return (
      <>
        <ellipse cx={176} cy={212} rx={10} ry={7} fill="#fff" />
        <circle cx={178} cy={213} r={4.5} fill={INK} stroke="none" />
      </>
    );
  }
  const lid = h.eyes === "sly";
  return (
    <>
      <ellipse cx={172} cy={208} rx={11} ry={lid ? 6 : 8} fill="#fff" />
      <ellipse cx={228} cy={208} rx={11} ry={lid ? 6 : 8} fill="#fff" />
      <circle cx={173} cy={209} r={5} fill={INK} stroke="none" />
      <circle cx={229} cy={209} r={5} fill={INK} stroke="none" />
      <circle cx={175} cy={207} r={1.6} fill="#fff" stroke="none" />
      <circle cx={231} cy={207} r={1.6} fill="#fff" stroke="none" />
    </>
  );
}

function brows(h: HumanArt): ReactNode {
  if (h.eyes === "hidden") return null;
  const c = h.hair.color === "#F6F2EC" ? "#BDB3A6" : h.hair.color;
  const d =
    h.brows === "angry"
      ? "M156 186 L186 194 M244 186 L214 194"
      : h.brows === "raised"
        ? "M156 186 Q172 174 188 184 M212 184 Q228 174 244 186"
        : "M158 188 Q172 182 186 188 M214 188 Q228 182 242 188";
  return <path d={d} fill="none" stroke={c} strokeWidth={7} />;
}

function mouth(h: HumanArt): ReactNode {
  const lips = h.extras?.includes("lipstick") ? "#C8102E" : INK;
  switch (h.mouth) {
    case "smile":
      return <path d="M180 270 Q200 288 220 270" fill="none" stroke={lips} />;
    case "smirk":
      return <path d="M182 274 Q204 282 222 266" fill="none" stroke={lips} strokeWidth={6} />;
    case "open":
      return <ellipse cx={200} cy={274} rx={12} ry={9} fill="#5A1E1E" />;
    default:
      return <path d="M184 274 L216 274" fill="none" stroke={lips} />;
  }
}

function facialHair(h: HumanArt): ReactNode {
  if (!h.facial) return null;
  const c = h.facial.color;
  switch (h.facial.style) {
    case "curl":
      return (
        <path
          d="M200 248 C186 244 168 246 158 256 C150 264 152 274 160 272 C156 266 162 260 172 260 C184 260 194 256 200 254 C206 256 216 260 228 260 C238 260 244 266 240 272 C248 274 250 264 242 256 C232 246 214 244 200 248 Z"
          fill={c}
        />
      );
    case "thin":
      return <path d="M172 254 C186 246 214 246 228 254 C214 256 186 256 172 254 Z" fill={c} strokeWidth={3} />;
    case "thick":
      return <path d="M164 258 C174 238 226 238 236 258 C222 264 178 264 164 258 Z" fill={c} />;
  }
}

function glasses(h: HumanArt): ReactNode {
  if (!h.glasses) return null;
  const c = h.glasses.color;
  switch (h.glasses.style) {
    case "round":
      return (
        <g fill="none" stroke={c} strokeWidth={5}>
          <circle cx={172} cy={208} r={19} />
          <circle cx={228} cy={208} r={19} />
          <path d="M191 206 Q200 200 209 206" />
        </g>
      );
    case "shades":
      return (
        <>
          <path d="M146 196 L196 196 L192 222 C188 230 156 230 150 222 Z" fill={c} />
          <path d="M204 196 L254 196 L250 222 C244 230 212 230 208 222 Z" fill={c} />
          <path d="M196 200 L204 200" fill="none" />
          <path d="M156 202 L168 202" fill="none" stroke="#fff" strokeWidth={3} />
          <path d="M214 202 L226 202" fill="none" stroke="#fff" strokeWidth={3} />
        </>
      );
    case "cateye":
      return (
        <>
          <path d="M140 192 L196 198 L192 222 C186 232 154 230 148 220 Z" fill={c} />
          <path d="M260 192 L204 198 L208 222 C214 232 246 230 252 220 Z" fill={c} />
          <path d="M196 204 L204 204" fill="none" />
          <path d="M156 204 L170 206" fill="none" stroke="#F7A1C4" strokeWidth={3} />
          <path d="M244 204 L230 206" fill="none" stroke="#F7A1C4" strokeWidth={3} />
        </>
      );
  }
}

function extras(h: HumanArt): ReactNode {
  const ex = h.extras ?? [];
  return (
    <>
      {ex.includes("freckles") &&
        [
          [160, 236],
          [168, 242],
          [176, 236],
          [224, 236],
          [232, 242],
          [240, 236],
        ].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={2.4} fill="#A0643C" stroke="none" />)}
      {ex.includes("blush") && (
        <>
          <circle cx={158} cy={244} r={12} fill="#F28B82" opacity={0.35} stroke="none" />
          <circle cx={242} cy={244} r={12} fill="#F28B82" opacity={0.35} stroke="none" />
        </>
      )}
      {ex.includes("earrings") && (
        <>
          <circle cx={128} cy={240} r={7} fill="#F2C14E" />
          <circle cx={272} cy={240} r={7} fill="#F2C14E" />
        </>
      )}
      {ex.includes("pearls") &&
        Array.from({ length: 9 }, (_, i) => {
          const t = i / 8;
          const x = 160 + t * 80;
          const y = 368 + Math.sin(t * Math.PI) * 30;
          return <circle key={i} cx={x} cy={y} r={7} fill="#FFFDF7" strokeWidth={3} />;
        })}
      {ex.includes("chain") && <path d="M160 366 Q200 430 240 366" fill="none" stroke="#E2B33C" strokeWidth={8} />}
    </>
  );
}

function human(h: HumanArt): Figure {
  const muscle = h.body === "muscle";
  const { body, detail } = outfit(h);
  const neck = muscle ? "M150 280 L146 344 L254 344 L250 280 Z" : "M172 288 L170 370 L230 370 L228 288 Z";
  return {
    silhouette: (
      <>
        {backHair(h)}
        {body}
        <path d={neck} fill={h.skin} />
        <ellipse cx={128} cy={214} rx={12} ry={20} fill={h.skin} />
        <ellipse cx={272} cy={214} rx={12} ry={20} fill={h.skin} />
        <ellipse cx={200} cy={204} rx={74} ry={90} fill={h.skin} />
        {frontHair(h)}
      </>
    ),
    details: (
      <>
        {detail}
        {muscle && <path d="M150 300 C170 320 230 320 250 300" fill="none" strokeWidth={4} />}
        <ellipse cx={200} cy={204} rx={74} ry={90} fill={h.skin} />
        {eyes(h)}
        {brows(h)}
        <path d="M200 216 C196 232 192 240 198 244 L208 244" fill="none" strokeWidth={4} />
        {facialHair(h)}
        {mouth(h)}
        {extras(h)}
        {frontHair(h)}
        {glasses(h)}
      </>
    ),
  };
}

// ------------------------------------------------------------------ creatures

function greyhound(a: CreatureArt): Figure {
  return {
    silhouette: (
      <>
        <path d="M64 480 C86 400 138 360 168 334 L232 334 C262 360 314 400 336 480 Z" fill={a.primary} />
        <path d="M160 336 C160 292 170 262 176 236 L224 236 C230 262 240 292 240 336 Z" fill={a.primary} />
        <path d="M154 126 C128 94 90 100 82 136 C98 134 112 142 122 156 C132 150 142 146 154 148 Z" fill={a.primary} />
        <path d="M246 126 C272 94 310 100 318 136 C302 134 288 142 278 156 C268 150 258 146 246 148 Z" fill={a.primary} />
        <path
          d="M200 98 C158 98 136 128 138 170 C140 208 160 242 176 274 C184 292 190 306 200 308 C210 306 216 292 224 274 C240 242 260 208 262 170 C264 128 242 98 200 98 Z"
          fill={a.primary}
        />
      </>
    ),
    details: (
      <>
        <path d="M170 344 C184 430 216 430 230 344 Z" fill={a.secondary} stroke="none" />
        <path d="M100 132 C108 128 116 132 120 146 M300 132 C292 128 284 132 280 146" fill="none" strokeWidth={3} opacity={0.5} />
        <ellipse cx={200} cy={268} rx={26} ry={34} fill={a.secondary} stroke="none" opacity={0.55} />
        <path d="M160 172 Q174 162 188 170 M240 172 Q226 162 212 170" fill="none" strokeWidth={5} />
        <path d="M164 334 Q200 356 236 334" fill="none" stroke={a.accent} strokeWidth={14} />
        <circle cx={200} cy={354} r={8} fill="#F2C14E" />
        <ellipse cx={175} cy={194} rx={10} ry={11} fill={INK} />
        <ellipse cx={225} cy={194} rx={10} ry={11} fill={INK} />
        <circle cx={178} cy={190} r={3} fill="#fff" stroke="none" />
        <circle cx={228} cy={190} r={3} fill="#fff" stroke="none" />
        <ellipse cx={200} cy={294} rx={15} ry={10} fill={INK} />
        <path d="M200 304 L200 312 M186 314 Q200 324 214 314" fill="none" strokeWidth={4} />
        {a.accent === "#E5383B" && (
          <>
            <ellipse cx={96} cy={440} rx={40} ry={34} fill={a.accent} />
            <ellipse cx={304} cy={440} rx={40} ry={34} fill={a.accent} />
            <path d="M80 432 Q96 420 112 432 M288 432 Q304 420 320 432" fill="none" stroke="#fff" strokeWidth={4} />
          </>
        )}
      </>
    ),
  };
}

function monkey(a: CreatureArt): Figure {
  return {
    silhouette: (
      <>
        <path d="M24 480 C34 396 100 360 156 352 L244 352 C300 360 366 396 376 480 Z" fill={a.accent} />
        <circle cx={112} cy={208} r={34} fill={a.primary} />
        <circle cx={288} cy={208} r={34} fill={a.primary} />
        <circle cx={200} cy={206} r={88} fill={a.primary} />
        <ellipse cx={92} cy={440} rx={46} ry={40} fill="#E63A2E" />
        <ellipse cx={308} cy={440} rx={46} ry={40} fill="#E63A2E" />
      </>
    ),
    details: (
      <>
        <path d="M156 352 L200 420 L244 352" fill={a.primary} />
        <path d="M150 356 L200 440 L250 356" fill="none" stroke="#F7C948" strokeWidth={8} />
        <circle cx={112} cy={208} r={18} fill={a.secondary} stroke="none" />
        <circle cx={288} cy={208} r={18} fill={a.secondary} stroke="none" />
        <path
          d="M200 160 C170 138 128 158 138 210 C144 262 174 294 200 294 C226 294 256 262 262 210 C272 158 230 138 200 160 Z"
          fill={a.secondary}
        />
        <path d="M156 188 L188 196 M244 188 L212 196" fill="none" strokeWidth={7} />
        <circle cx={176} cy={210} r={9} fill={INK} />
        <circle cx={224} cy={210} r={9} fill={INK} />
        <circle cx={179} cy={207} r={2.5} fill="#fff" stroke="none" />
        <circle cx={227} cy={207} r={2.5} fill="#fff" stroke="none" />
        <circle cx={192} cy={242} r={4} fill={INK} stroke="none" />
        <circle cx={208} cy={242} r={4} fill={INK} stroke="none" />
        <path d="M168 262 Q200 290 232 262 Q200 276 168 262 Z" fill="#fff" />
        <path d="M76 432 Q92 418 108 432 M292 432 Q308 418 324 432" fill="none" stroke="#fff" strokeWidth={4} />
      </>
    ),
  };
}

function gorilla(a: CreatureArt): Figure {
  return {
    silhouette: (
      <>
        <path d="M-10 480 C0 380 70 320 150 310 L250 310 C330 320 400 380 410 480 Z" fill={a.primary} />
        <path
          d="M200 92 C138 92 108 146 114 210 C118 272 158 304 200 304 C242 304 282 272 286 210 C292 146 262 92 200 92 Z"
          fill={a.primary}
        />
      </>
    ),
    details: (
      <>
        <path d="M120 150 C150 136 250 136 280 150 L282 168 C250 156 150 156 118 168 Z" fill="#D90012" stroke="none" />
        <path d="M118 168 C150 156 250 156 282 168 L282 184 C250 172 150 172 118 184 Z" fill="#0033A0" stroke="none" />
        <path d="M118 184 C150 172 250 172 282 184 L280 198 C250 188 150 188 120 198 Z" fill="#F2A800" stroke="none" />
        <path
          d="M200 196 C158 196 142 226 148 256 C156 292 244 292 252 256 C258 226 242 196 200 196 Z"
          fill={a.secondary}
        />
        <path d="M150 208 C170 196 230 196 250 208" fill="none" strokeWidth={8} />
        <circle cx={176} cy={222} r={6} fill={INK} />
        <circle cx={224} cy={222} r={6} fill={INK} />
        <ellipse cx={190} cy={250} rx={7} ry={5} fill={INK} stroke="none" />
        <ellipse cx={210} cy={250} rx={7} ry={5} fill={INK} stroke="none" />
        <path d="M176 276 Q200 266 224 276" fill="none" />
        <path d="M120 400 C150 380 180 380 200 400 C220 380 250 380 280 400" fill="none" strokeWidth={4} opacity={0.6} />
      </>
    ),
  };
}

function catknight(a: CreatureArt): Figure {
  return {
    silhouette: (
      <>
        <path d="M24 480 C34 400 90 368 150 360 L250 360 C310 368 366 400 376 480 Z" fill={a.primary} />
        <path d="M140 126 L150 60 L186 104 Z" fill={a.secondary} />
        <path d="M260 126 L250 60 L214 104 Z" fill={a.secondary} />
        <path d="M200 40 C226 40 236 60 230 90 L170 90 C164 60 174 40 200 40 Z" fill={a.accent} />
        <path
          d="M200 90 C136 90 112 140 114 200 C116 270 150 330 200 336 C250 330 284 270 286 200 C288 140 264 90 200 90 Z"
          fill={a.primary}
        />
      </>
    ),
    details: (
      <>
        <ellipse cx={72} cy={420} rx={64} ry={46} fill={a.primary} />
        <ellipse cx={328} cy={420} rx={64} ry={46} fill={a.primary} />
        <path d="M30 420 Q72 396 114 420 M286 420 Q328 396 370 420" fill="none" strokeWidth={4} />
        <path d="M150 170 C170 156 230 156 250 170 L246 270 C230 292 170 292 154 270 Z" fill={a.secondary} />
        <path d="M200 96 L200 156" fill="none" strokeWidth={4} />
        <path d="M168 206 C176 194 192 196 194 210 C184 218 172 216 168 206 Z" fill="#F7D02C" />
        <path d="M232 206 C224 194 208 196 206 210 C216 218 228 216 232 206 Z" fill="#F7D02C" />
        <path d="M182 198 L182 216 M218 198 L218 216" fill="none" strokeWidth={4} />
        <path d="M192 236 L208 236 L200 246 Z" fill="#F28B82" />
        <path d="M200 246 Q192 258 184 252 M200 246 Q208 258 216 252" fill="none" strokeWidth={3} />
        <path d="M166 240 L132 234 M166 248 L134 254 M234 240 L268 234 M234 248 L266 254" fill="none" strokeWidth={3} />
        <circle cx={130} cy={300} r={5} fill={INK} stroke="none" />
        <circle cx={270} cy={300} r={5} fill={INK} stroke="none" />
      </>
    ),
  };
}

function dog(a: CreatureArt): Figure {
  return {
    silhouette: (
      <>
        <path d="M40 480 C52 404 110 368 160 358 L240 358 C290 368 348 404 360 480 Z" fill={a.primary} />
        <path d="M128 140 C96 150 88 220 108 262 C126 250 140 226 146 188 Z" fill="#8E5A26" />
        <path d="M272 140 C304 150 312 220 292 262 C274 250 260 226 254 188 Z" fill="#8E5A26" />
        <path
          d="M200 110 C150 110 126 150 128 200 C130 262 160 306 200 306 C240 306 270 262 272 200 C274 150 250 110 200 110 Z"
          fill={a.primary}
        />
      </>
    ),
    details: (
      <>
        <path d="M150 360 L200 410 L250 360 L230 352 L200 380 L170 352 Z" fill="#169B62" />
        <path d="M176 362 L200 392 L224 362 Z" fill={a.accent} stroke="none" />
        <path d="M200 200 C166 200 152 236 160 262 C168 294 232 294 240 262 C248 236 234 200 200 200 Z" fill={a.secondary} />
        <circle cx={172} cy={196} r={9} fill={INK} />
        <circle cx={228} cy={196} r={9} fill={INK} />
        <circle cx={175} cy={193} r={2.5} fill="#fff" stroke="none" />
        <circle cx={231} cy={193} r={2.5} fill="#fff" stroke="none" />
        <ellipse cx={200} cy={236} rx={14} ry={10} fill={INK} />
        <path d="M200 246 L200 258 M184 262 Q200 274 216 262" fill="none" strokeWidth={4} />
        <path d="M194 268 C194 290 214 290 212 268 Z" fill="#F28B82" />
      </>
    ),
  };
}

function sausage(a: CreatureArt): Figure {
  return {
    silhouette: (
      <>
        <path d="M134 250 L72 178" fill="none" stroke={a.primary} strokeWidth={22} />
        <path d="M266 250 L328 178" fill="none" stroke={a.primary} strokeWidth={22} />
        <path
          d="M200 84 C146 84 134 134 134 196 L134 430 C134 482 266 482 266 430 L266 196 C266 134 254 84 200 84 Z"
          fill={a.primary}
        />
      </>
    ),
    details: (
      <>
        <path d="M156 130 C150 170 150 300 156 400" fill="none" stroke={a.secondary} strokeWidth={10} opacity={0.8} />
        <circle cx={180} cy={190} r={7} fill={INK} />
        <circle cx={220} cy={190} r={7} fill={INK} />
        <path d="M182 220 Q200 236 218 220" fill="none" />
        <circle cx={66} cy={172} r={14} fill={a.primary} />
        <circle cx={334} cy={172} r={14} fill={a.primary} />
      </>
    ),
  };
}

function stretchy(a: CreatureArt): Figure {
  const female = a.variant === "female";
  return {
    silhouette: (
      <>
        <path d="M110 480 C118 434 150 410 180 404 L220 404 C250 410 282 434 290 480 Z" fill={a.secondary} />
        <path d="M186 160 C166 240 238 300 210 410 L240 410 C268 300 200 240 216 160 Z" fill={a.primary} />
        <circle cx={200} cy={118} r={64} fill={a.primary} />
        {female && <path d="M200 52 L162 30 L166 74 Z M200 52 L238 30 L234 74 Z" fill={a.secondary} />}
      </>
    ),
    details: (
      <>
        {female && <circle cx={200} cy={52} r={10} fill={a.secondary} />}
        <circle cx={180} cy={112} r={7} fill={INK} />
        <circle cx={220} cy={112} r={7} fill={INK} />
        {female && <path d="M170 102 L166 96 M176 100 L174 94 M230 102 L234 96 M224 100 L226 94" fill="none" strokeWidth={3} />}
        <path d="M176 140 Q200 162 224 140" fill="none" />
        <circle cx={164} cy={134} r={10} fill="#F28B82" opacity={0.5} stroke="none" />
        <circle cx={236} cy={134} r={10} fill="#F28B82" opacity={0.5} stroke="none" />
        <path d="M170 404 Q200 420 230 404" fill="none" />
      </>
    ),
  };
}

function bigfoot(a: CreatureArt): Figure {
  return {
    silhouette: (
      <>
        <path
          d="M10 480 C16 400 70 346 140 336 L260 336 C330 346 384 400 390 480 Z"
          fill={a.primary}
        />
        <path
          d="M200 84 L222 100 L246 92 L258 116 L284 120 L286 148 L306 168 L294 192 L304 220 L284 238 L288 266 L262 278 L250 304 L222 300 L200 318 L178 300 L150 304 L138 278 L112 266 L116 238 L96 220 L106 192 L94 168 L114 148 L116 120 L142 116 L154 92 L178 100 Z"
          fill={a.primary}
        />
        <rect x={292} y={292} width={64} height={110} rx={12} fill="#222" />
      </>
    ),
    details: (
      <>
        <path d="M200 170 C160 170 146 204 150 238 C156 276 244 276 250 238 C254 204 240 170 200 170 Z" fill={a.secondary} />
        <path d="M158 190 L190 198 M242 190 L210 198" fill="none" strokeWidth={7} />
        <circle cx={178} cy={212} r={7} fill={INK} />
        <circle cx={222} cy={212} r={7} fill={INK} />
        <ellipse cx={200} cy={236} rx={10} ry={7} fill={INK} />
        <path d="M182 256 Q200 268 218 256" fill="none" />
        <rect x={300} y={302} width={48} height={84} rx={6} fill="#7CC3E0" />
        <circle cx={324} cy={394} r={3} fill="#555" stroke="none" />
        <path d="M262 400 C280 380 290 370 300 360" fill="none" stroke={a.primary} strokeWidth={26} />
      </>
    ),
  };
}

function duo(a: CreatureArt): Figure {
  return {
    silhouette: (
      <>
        <path d="M10 480 C18 420 60 392 110 386 L180 386 C214 392 230 430 234 480 Z" fill={a.primary} />
        <path d="M200 480 C204 430 222 400 256 394 L320 394 C360 400 392 430 396 480 Z" fill={a.secondary} />
        <path d="M86 200 C70 214 66 270 80 300 C94 290 102 266 104 236 Z" fill={a.primary} />
        <path d="M200 200 C216 214 220 270 206 300 C192 290 184 266 182 236 Z" fill={a.primary} />
        <ellipse cx={144} cy={268} rx={66} ry={74} fill={a.primary} />
        <path d="M254 238 L262 178 L296 222 Z M354 238 L346 178 L312 222 Z" fill={a.secondary} />
        <ellipse cx={304} cy={290} rx={64} ry={58} fill={a.secondary} />
      </>
    ),
    details: (
      <>
        <circle cx={122} cy={260} r={8} fill="#fff" />
        <circle cx={166} cy={260} r={8} fill="#fff" />
        <circle cx={123} cy={261} r={4} fill={INK} stroke="none" />
        <circle cx={167} cy={261} r={4} fill={INK} stroke="none" />
        <ellipse cx={144} cy={296} rx={13} ry={9} fill="#444" stroke="#444" />
        <path d="M144 305 L144 314 M130 318 Q144 328 158 318" fill="none" stroke="#666" strokeWidth={4} />
        <path d="M282 282 C288 274 298 276 298 286 C290 290 284 290 282 282 Z" fill={INK} />
        <path d="M326 282 C320 274 310 276 310 286 C318 290 324 290 326 282 Z" fill={INK} />
        <path d="M296 302 L312 302 L304 310 Z" fill="#F28B82" />
        <path d="M280 306 L248 300 M280 314 L250 318 M328 306 L360 300 M328 314 L358 318" fill="none" strokeWidth={3} />
        <path d="M264 270 C270 262 278 262 282 266" fill="none" stroke="#D97B29" strokeWidth={4} />
      </>
    ),
  };
}

// ------------------------------------------------------------------ unknown

function UnknownPortrait({ initials, className, title }: { initials: string; className?: string; title: string }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} role="img" aria-label={title} preserveAspectRatio="xMidYMax meet">
      <g fill="#151515" opacity={0.14}>
        <path d={SHOULDERS} />
        <path d="M172 288 L170 370 L230 370 L228 288 Z" />
        <ellipse cx={200} cy={204} rx={78} ry={94} />
      </g>
      <text
        x={200}
        y={236}
        textAnchor="middle"
        fontFamily="var(--font-display), system-ui, sans-serif"
        fontWeight={800}
        fontSize={96}
        fill="#151515"
        opacity={0.82}
        letterSpacing={-4}
      >
        {initials}
      </text>
    </svg>
  );
}

// ------------------------------------------------------------------ entry

export function initialsOf(name: string): string {
  return name
    .replace(/\(.*?\)/g, "")
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w) && !["the", "of"].includes(w.toLowerCase()))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export default function CharacterArt({
  art,
  name,
  className,
}: {
  art: Art | undefined;
  name: string;
  className?: string;
}) {
  const title = `Illustration of ${name}`;
  if (!art || art.kind === "unknown") {
    return <UnknownPortrait initials={initialsOf(name)} className={className} title={`${name}: portrait not captured`} />;
  }
  let figure: Figure;
  switch (art.kind) {
    case "human":
      figure = human(art);
      break;
    case "greyhound":
      figure = greyhound(art);
      break;
    case "monkey":
      figure = monkey(art);
      break;
    case "gorilla":
      figure = gorilla(art);
      break;
    case "catknight":
      figure = catknight(art);
      break;
    case "dog":
      figure = dog(art);
      break;
    case "sausage":
      figure = sausage(art);
      break;
    case "stretchy":
      figure = stretchy(art);
      break;
    case "bigfoot":
      figure = bigfoot(art);
      break;
    case "duo":
      figure = duo(art);
      break;
  }
  return <Sticker figure={figure} className={className} title={title} />;
}
