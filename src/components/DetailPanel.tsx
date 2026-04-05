import "./DetailPanel.css";

interface Props {
  title: string;
  visible: boolean;
}

export function DetailPanel({ title, visible }: Props) {
  return (
    <div
      className={`detail-panel-wrapper${visible ? " detail-panel-wrapper--open" : ""}`}
    >
      <div className="detail-panel">
        <h1 className="detail-title">{title}</h1>
        <div className="detail-meta">
          <img src="/fragments/IMDB_Rating_6_8_out_of_10.png" alt="IMDb 6.8" />
          <img src="/fragments/from_93018_customers.png" alt="93K ratings" />
          <img src="/fragments/1_hour_41_minutes.png" alt="1h 41m" />
          <img src="/fragments/2023.png" alt="2023" />
          <img src="/fragments/Rated_R.png" alt="R" />
          <img src="/fragments/X-ray_available.png" alt="X-Ray" />
          <img src="/fragments/Closed_captioning_available.png" alt="CC" />
          <img src="/fragments/Available_in_UHD.png" alt="UHD" />
        </div>
        <p className="detail-desc">
          <img
            src="/fragments/An_ordinary_family_man_Nicolas_Cage_finds_his_life_turned_upside_down_when_milli.png"
            alt="Description"
          />
        </p>
        <div className="detail-entitlement">
          <img
            src="/fragments/Free_with_Ads_Play_now_on_Tubi.png"
            alt="Free with Ads"
          />
        </div>
      </div>
    </div>
  );
}
