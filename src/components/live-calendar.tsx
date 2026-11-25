"use client";
import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, List } from "lucide-react";
export function LiveCalendar({
  sessions,
  children,
}: {
  sessions: { id: string; title: string; startsAt: string; status: string }[];
  children: React.ReactNode;
}) {
  const [calendar, setCalendar] = useState(false);
  const [month, setMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const offset = (month.getDay() + 1) % 7;
  const count = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  return (
    <>
      <div className="row wrap" style={{ marginBottom: 20 }}>
        <button
          className={`btn sm ${!calendar ? "" : "secondary"}`}
          onClick={() => setCalendar(false)}
        >
          <List size={15} />
          القائمة
        </button>
        <button
          className={`btn sm ${calendar ? "" : "secondary"}`}
          onClick={() => setCalendar(true)}
        >
          <CalendarDays size={15} />
          التقويم
        </button>
      </div>
      {calendar ? (
        <section className="card pad">
          <div className="row between" style={{ marginBottom: 20 }}>
            <button
              className="icon-btn"
              onClick={() =>
                setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
              }
              aria-label="الشهر السابق"
            >
              <ChevronRight size={17} />
            </button>
            <h2>
              {month.toLocaleDateString("ar-DZ", {
                month: "long",
                year: "numeric",
              })}
            </h2>
            <button
              className="icon-btn"
              onClick={() =>
                setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
              }
              aria-label="الشهر التالي"
            >
              <ChevronLeft size={17} />
            </button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7,minmax(100px,1fr))",
                minWidth: 700,
              }}
            >
              {[
                "السبت",
                "الأحد",
                "الإثنين",
                "الثلاثاء",
                "الأربعاء",
                "الخميس",
                "الجمعة",
              ].map((day) => (
                <div
                  key={day}
                  className="muted small"
                  style={{
                    padding: 12,
                    textAlign: "center",
                    borderBottom: "1px solid var(--line)",
                  }}
                >
                  {day}
                </div>
              ))}
              {Array.from(
                { length: Math.ceil((offset + count) / 7) * 7 },
                (_, i) => {
                  const day = i - offset + 1;
                  return (
                    <div
                      key={i}
                      style={{
                        minHeight: 115,
                        padding: 9,
                        border: "1px solid var(--line)",
                      }}
                    >
                      {day > 0 && day <= count && (
                        <>
                          <span className="latin small muted">{day}</span>
                          {sessions
                            .filter((s) => {
                              const d = new Date(s.startsAt);
                              return (
                                d.getDate() === day &&
                                d.getMonth() === month.getMonth() &&
                                d.getFullYear() === month.getFullYear()
                              );
                            })
                            .map((s) => (
                              <a
                                key={s.id}
                                href={`/admin/live/${s.id}`}
                                className={`pill ${s.status === "CANCELLED" ? "red" : ""}`}
                                style={{
                                  display: "block",
                                  fontSize: 10,
                                  marginTop: 7,
                                  lineHeight: 1.5,
                                }}
                              >
                                {new Date(s.startsAt).toLocaleTimeString(
                                  "ar-DZ",
                                  { hour: "2-digit", minute: "2-digit" },
                                )}
                                <br />
                                {s.title}
                              </a>
                            ))}
                        </>
                      )}
                    </div>
                  );
                },
              )}
            </div>
          </div>
        </section>
      ) : (
        children
      )}
    </>
  );
}
