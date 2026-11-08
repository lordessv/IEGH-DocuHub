"use strict";

/*
 * IEGH DocuHub
 * Investigation list enhancements
 *
 * Shows:
 * - Full location address
 * - Alphabetically sorted assigned investigators
 *
 * Uses the existing Supabase connection,
 * investigation records, and member directory.
 */

(function () {
  const originalRenderInvestigations =
    renderInvestigations;

  let renderVersion = 0;

  function fullAddress(location) {
    if (!location) return "";

    const street = String(location.address || "").trim();

    const city = String(location.city || "").trim();
    const state = String(location.state || "").trim();
    const zip = String(location.postal_code || "").trim();

    const region = [city, state].filter(Boolean).join(", ");

    const regionWithZip =
      [region, zip].filter(Boolean).join(" ");

    return [street, regionWithZip]
      .filter(Boolean)
      .join(", ");
  }

  function makeDetail(label, value) {
    const row = document.createElement("p");
    row.className = "muted";

    const heading = document.createElement("strong");
    heading.textContent = label + ": ";

    const content = document.createElement("span");
    content.textContent = value;

    row.append(heading, content);

    return row;
  }

  function insertBeforeActions(card, element) {
    const actions = card.querySelector(".actions");

    if (actions) {
      card.insertBefore(element, actions);
    } else {
      card.append(element);
    }
  }

  async function enrichInvestigationCards(version) {
    const box = document.getElementById(
      "investigationList"
    );

    if (!box || !investigations.length) return;

    const cards = Array.from(
      box.querySelectorAll(":scope > .item")
    );

    const investigatorRows = new Map();

    for (const [index, investigation] of
      investigations.entries()) {

      const card = cards[index];

      if (!card) continue;

      const location = locations.find(
        item => item.id === investigation.location_id
      );

      const address = fullAddress(location);

      insertBeforeActions(
        card,
        makeDetail(
          "Address",
          address || "No address recorded"
        )
      );

      const investigatorRow = makeDetail(
        "Assigned Investigators",
        "Loading..."
      );

      insertBeforeActions(card, investigatorRow);

      investigatorRows.set(
        investigation.id,
        investigatorRow.querySelector("span")
      );
    }

    try {
      const investigationIds = investigations.map(
        investigation => investigation.id
      );

      const { data, error } = await db
        .from("investigation_members")
        .select("investigation_id, member_id")
        .in("investigation_id", investigationIds);

      if (version !== renderVersion) return;

      if (error) throw error;

      const assignmentsByInvestigation = new Map();

      for (const assignment of data || []) {
        const id = assignment.investigation_id;

        if (!assignmentsByInvestigation.has(id)) {
          assignmentsByInvestigation.set(id, []);
        }

        assignmentsByInvestigation
          .get(id)
          .push(assignment.member_id);
      }

      for (const investigation of investigations) {
        const field = investigatorRows.get(
          investigation.id
        );

        if (!field) continue;

        const assignedIds =
          assignmentsByInvestigation.get(
            investigation.id
          ) || [];

        const names = assignedIds.map(id => {
          const member = members.find(
            item => item.id === id
          );

          return member
            ? memberName(member)
            : "Unknown member";
        });

        names.sort((a, b) =>
          a.localeCompare(b, "en", {
            sensitivity: "base"
          })
        );

        field.textContent = names.length
          ? names.join(", ")
          : "No investigators assigned";
      }

    } catch (error) {
      if (version !== renderVersion) return;

      for (const field of investigatorRows.values()) {
        field.textContent =
          "Unable to load assignments";
      }

      console.error(
        "Investigation assignment display error:",
        error
      );
    }
  }

  renderInvestigations = function () {
    const version = ++renderVersion;

    originalRenderInvestigations();

    enrichInvestigationCards(version);
  };

  // Enhance the investigation cards already on screen.
  if (
    typeof user !== "undefined" &&
    user &&
    Array.isArray(investigations) &&
    investigations.length
  ) {
    renderInvestigations();
  }
})();
