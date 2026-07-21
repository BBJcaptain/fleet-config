/* ============================================================================
   FIELD SOURCE REFERENCES
   ----------------------------------------------------------------------------
   Where each value comes from in the official documentation. Shown as the small
   ⓘ tooltip next to every field in ALL THREE apps — the viewer (index.html),
   the editor (editor.html) and the collector (collector.html).

   ONE file drives all three, so the tooltips can never drift apart.

   ── HOW TO EDIT ─────────────────────────────────────────────────────────────
   • Change the text after a field name. Keep the quotes and the trailing comma.
   • Leave "Source Pending" wherever you have not confirmed the reference yet —
     that is shown to pilots as-is, so the gap is visible and honest.
   • Save this file, then double-click publish-to-github-repo.command.

   Format:  field_key: "FCOM / Chapter / Section / Sub-section",

   Nothing here is confidential: these are pointers to where information lives,
   not the information itself. The file is served publicly alongside the apps.
   ========================================================================== */

window.FLEET_SOURCES = {

  /* ---- Identification ---- */
  registration:            "Centrik/Operations/Aircraft/Aircraft Documents/Certificate of Airworthiness",
  model:                   "Centrik/Operations/Aircraft/Aircraft Documents/Certificate of Airworthiness",
  msn:                     "Centrik/Operations/Aircraft/Aircraft Documents/Certificate of Airworthiness",
  first_flight:            "Source Pending",
  first_owner:             "Source Pending",

  /* ---- Performance ---- */
  mlw_t:                   "NAVBLUE EFB/Aircraft/Weight Variant",
  takeoff_tailwind_kts:    "FCOM / Limitations / Aircraft General / Operational Parameters / Airport Operations and Wind Limitations",
  landing_tailwind_kts:    "FCOM / Limitations / Aircraft General / Operational Parameters / Airport Operations and Wind Limitations",
  narrow_runway_approved:  "FCOM / Limitations / Aircraft General / Operational Parameters / Airport Operations and Wind Limitations",
  se_taxi_no_apu:          "FCOM/General Information/Aircraft Config Summary",
  max_altitude_autoland:   "Source Pending",
  noise_chapter:           "Centrik/Operations/Aircraft/Aircraft Documents/Noise Certicifate",

  /* ---- Equipment ---- */
  brk_fan:                 "Source Pending",
  winglets:                "Source Pending",
  engine_type:             "Source Pending",
  cargo_heat:              "Source Pending",
  soft_goaround:           "FCOM/General Information/Aircraft Config Summary",
  satcom:                  "Source Pending",
  headset_plug:            "Visual Inspection",
  acars:                   "Source Pending",
  acars_datalink:          "Source Pending",
  init:                    "Pilot Feedback",
  adiru_type:              "Source Pending",
  weather_radar_type:      "Source Pending",
  hf_radio:                "Centrik/Operations/Aircraft/Aircraft Documents/ASL Radio Equipment",
  cpdlc:                   "FCOM/General Information/Aircraft Config Summary/",
  transponder:             "FCOM/Aircraft Systems/34-SURV/34-SURV 60-TCAS/60 20/ATC/TCAS Panel",

  /* ---- Remarks ---- */
  remarks:                 "Free text"
};
