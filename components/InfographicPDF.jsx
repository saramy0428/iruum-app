import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// Korean serif font fetched at render time. @react-pdf needs CJK glyphs
// registered before render or hangul/hanja shows as boxes.
// Using jsdelivr mirror of notofonts/noto-cjk — stable, no auth needed.
Font.register({
  family: "NotoSerifKR",
  src: "https://cdn.jsdelivr.net/gh/notofonts/noto-cjk@main/Serif/SubsetOTF/KR/NotoSerifKR-Regular.otf",
});

const C = {
  paper:     "#faf8f3",
  ink:       "#1a1a1a",
  vermilion: "#c8392b",
  stone:     "#6b6b6b",
  rule:      "#e3ddd0",
};

const s = StyleSheet.create({
  page: {
    backgroundColor: C.paper,
    color: C.ink,
    padding: 48,
    fontFamily: "Helvetica",
    fontSize: 10,
  },
  eyebrow: {
    fontSize: 8,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: C.stone,
    marginBottom: 8,
  },
  h1: { fontSize: 32, fontFamily: "Times-Roman", marginBottom: 4 },
  h1Korean: { fontSize: 32, fontFamily: "NotoSerifKR", color: C.vermilion },
  subtle: { fontSize: 11, color: C.stone, marginTop: 2 },
  rule: { borderBottomWidth: 1, borderBottomColor: C.rule, marginVertical: 18 },
  section: { marginTop: 18 },
  sectionTitle: {
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: C.stone,
    marginBottom: 8,
  },
  row: { flexDirection: "row" },
  pillar: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: C.rule,
    paddingHorizontal: 6,
    alignItems: "center",
  },
  pillarLast: { borderRightWidth: 0 },
  pillarLabel: { fontSize: 8, color: C.stone, marginBottom: 6 },
  pillarStem:   { fontSize: 18, fontFamily: "NotoSerifKR" },
  pillarBranch: { fontSize: 14, fontFamily: "NotoSerifKR", marginTop: 2, color: C.stone },
  elements: { flexDirection: "row", marginTop: 4 },
  elementCol: { flex: 1, alignItems: "center" },
  elementName: { fontSize: 9, color: C.stone, marginBottom: 4 },
  elementBarTrack: {
    width: 6,
    height: 60,
    backgroundColor: C.rule,
    justifyContent: "flex-end",
  },
  elementBarFill: { width: 6, backgroundColor: C.ink },
  elementValue: { fontSize: 9, marginTop: 4 },
  body: { fontSize: 11, lineHeight: 1.6, color: C.ink },
  bodyKorean: { fontFamily: "NotoSerifKR" },
  footer: {
    position: "absolute",
    bottom: 32,
    left: 48,
    right: 48,
    fontSize: 8,
    color: C.stone,
    textAlign: "center",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
});

// Pulls the four pillar pairs from getFourPillars output.
// Shape: { yearStem, yearBranch, monthStem, monthBranch, ... } with .hanja keys.
function pillarPairs(fp) {
  const get = (k) => fp?.[k]?.hanja ?? fp?.[k]?.korean ?? "—";
  return [
    { label: "Year",  stem: get("yearStem"),  branch: get("yearBranch")  },
    { label: "Month", stem: get("monthStem"), branch: get("monthBranch") },
    { label: "Day",   stem: get("dayStem"),   branch: get("dayBranch")   },
    { label: "Hour",  stem: get("hourStem"),  branch: get("hourBranch")  },
  ];
}

const ELEMENT_ORDER = ["Wood", "Fire", "Earth", "Metal", "Water"];

export function InfographicPDF({
  surname,
  recommendedName,
  sajuSummary,
  fourPillars,
  reason,
  generatedAt,
}) {
  const pillars = pillarPairs(fourPillars);
  const dist = sajuSummary?.elementalDistribution ?? {};
  const distMax = Math.max(1, ...ELEMENT_ORDER.map((e) => Number(dist[e] ?? 0)));

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.eyebrow}>iRuum · Personalized Saju</Text>

        <Text style={s.h1}>
          {recommendedName?.romanized ?? "—"} {surname ?? ""}
        </Text>
        <Text style={s.h1Korean}>
          {recommendedName?.hangul ?? ""}
          {recommendedName?.hanja ? `  (${recommendedName.hanja})` : ""}
        </Text>
        {recommendedName?.meaning ? (
          <Text style={s.subtle}>{recommendedName.meaning}</Text>
        ) : null}

        <View style={s.rule} />

        <View style={s.section}>
          <Text style={s.sectionTitle}>Four Pillars · 사주</Text>
          <View style={s.row}>
            {pillars.map((p, i) => (
              <View
                key={p.label}
                style={[s.pillar, i === pillars.length - 1 && s.pillarLast]}
              >
                <Text style={s.pillarLabel}>{p.label}</Text>
                <Text style={s.pillarStem}>{p.stem}</Text>
                <Text style={s.pillarBranch}>{p.branch}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Five Elements · 오행</Text>
          <View style={s.elements}>
            {ELEMENT_ORDER.map((el) => {
              const v = Number(dist[el] ?? 0);
              const h = Math.round((v / distMax) * 60);
              return (
                <View key={el} style={s.elementCol}>
                  <Text style={s.elementName}>{el}</Text>
                  <View style={s.elementBarTrack}>
                    <View style={[s.elementBarFill, { height: h }]} />
                  </View>
                  <Text style={s.elementValue}>{v}</Text>
                </View>
              );
            })}
          </View>
          {sajuSummary?.dominantElement || sajuSummary?.lackingElement ? (
            <Text style={[s.subtle, { marginTop: 10 }]}>
              {sajuSummary.dominantElement
                ? `Dominant: ${sajuSummary.dominantElement}`
                : ""}
              {sajuSummary.dominantElement && sajuSummary.lackingElement
                ? "  ·  "
                : ""}
              {sajuSummary.lackingElement
                ? `Lacking: ${sajuSummary.lackingElement}`
                : ""}
            </Text>
          ) : null}
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Why this name</Text>
          <Text style={[s.body, s.bodyKorean]}>{reason ?? ""}</Text>
        </View>

        <Text style={s.footer}>
          iRuum · 이룸 ·{" "}
          {generatedAt
            ? new Date(generatedAt).toISOString().slice(0, 10)
            : ""}
        </Text>
      </Page>
    </Document>
  );
}
