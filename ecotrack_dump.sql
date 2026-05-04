--
-- PostgreSQL database dump
--

\restrict s7NrtTY8Q2ExqpUiQh7F9AQjhs8iFX1W3yB20vtz0qkFCgDSaIy6eVnkk7kf9Uq

-- Dumped from database version 15.17 (Debian 15.17-1.pgdg13+1)
-- Dumped by pg_dump version 15.17 (Debian 15.17-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: app_user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_user (
    user_id integer NOT NULL,
    company_id integer NOT NULL,
    email character varying(200) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(50),
    full_name character varying(200) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT app_user_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'manager'::character varying, 'analyst'::character varying, 'supplier'::character varying, 'viewer'::character varying])::text[])))
);


--
-- Name: app_user_user_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.app_user_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: app_user_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.app_user_user_id_seq OWNED BY public.app_user.user_id;


--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_log (
    log_id integer NOT NULL,
    user_id integer,
    action character varying(50) NOT NULL,
    table_name character varying(100),
    record_id integer,
    "timestamp" timestamp with time zone DEFAULT now(),
    details jsonb
);


--
-- Name: audit_log_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.audit_log_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: audit_log_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.audit_log_log_id_seq OWNED BY public.audit_log.log_id;


--
-- Name: carbon_offset; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.carbon_offset (
    offset_id integer NOT NULL,
    company_id integer NOT NULL,
    project_name character varying(200),
    certification_body character varying(100),
    credits_purchased numeric(14,4),
    credits_retired numeric(14,4) DEFAULT 0,
    purchase_date date NOT NULL
);


--
-- Name: carbon_offset_offset_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.carbon_offset_offset_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: carbon_offset_offset_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.carbon_offset_offset_id_seq OWNED BY public.carbon_offset.offset_id;


--
-- Name: company; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.company (
    company_id integer NOT NULL,
    name character varying(200) NOT NULL,
    industry character varying(100),
    country character varying(100) NOT NULL,
    tax_id character varying(50),
    founded_year integer,
    CONSTRAINT company_founded_year_check CHECK ((founded_year > 1800))
);


--
-- Name: company_company_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.company_company_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: company_company_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.company_company_id_seq OWNED BY public.company.company_id;


--
-- Name: compliance_record; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.compliance_record (
    record_id integer NOT NULL,
    company_id integer NOT NULL,
    framework_id integer NOT NULL,
    reporting_period character varying(20),
    target_co2e numeric(18,4),
    actual_co2e numeric(18,4),
    status character varying(30),
    CONSTRAINT compliance_record_status_check CHECK (((status)::text = ANY ((ARRAY['compliant'::character varying, 'non_compliant'::character varying, 'pending'::character varying])::text[])))
);


--
-- Name: compliance_record_record_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.compliance_record_record_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: compliance_record_record_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.compliance_record_record_id_seq OWNED BY public.compliance_record.record_id;


--
-- Name: emission_activity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.emission_activity (
    activity_id integer NOT NULL,
    facility_id integer,
    supplier_id integer,
    recorded_by integer,
    scope smallint NOT NULL,
    activity_type character varying(100),
    co2e_kg numeric(16,4) NOT NULL,
    activity_date date NOT NULL,
    notes text,
    status character varying(20) DEFAULT 'pending'::character varying,
    approved_by integer,
    approved_at timestamp with time zone,
    CONSTRAINT emission_activity_scope_check CHECK ((scope = ANY (ARRAY[1, 2, 3]))),
    CONSTRAINT emission_activity_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);


--
-- Name: emission_activity_activity_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.emission_activity_activity_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: emission_activity_activity_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.emission_activity_activity_id_seq OWNED BY public.emission_activity.activity_id;


--
-- Name: facility; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.facility (
    facility_id integer NOT NULL,
    company_id integer NOT NULL,
    name character varying(200) NOT NULL,
    location character varying(200),
    facility_type character varying(50),
    size_sqm numeric(12,2),
    CONSTRAINT facility_facility_type_check CHECK (((facility_type)::text = ANY ((ARRAY['warehouse'::character varying, 'factory'::character varying, 'office'::character varying, 'port'::character varying, 'farm'::character varying])::text[])))
);


--
-- Name: facility_facility_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.facility_facility_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: facility_facility_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.facility_facility_id_seq OWNED BY public.facility.facility_id;


--
-- Name: regulatory_framework; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.regulatory_framework (
    framework_id integer NOT NULL,
    name character varying(200) NOT NULL,
    jurisdiction character varying(100),
    target_year integer
);


--
-- Name: regulatory_framework_framework_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.regulatory_framework_framework_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: regulatory_framework_framework_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.regulatory_framework_framework_id_seq OWNED BY public.regulatory_framework.framework_id;


--
-- Name: shipment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shipment (
    shipment_id integer NOT NULL,
    supplier_id integer,
    company_id integer,
    transport_mode character varying(30),
    distance_km numeric(10,2),
    weight_kg numeric(14,2),
    co2e_kg numeric(16,4),
    shipment_date date NOT NULL,
    CONSTRAINT shipment_transport_mode_check CHECK (((transport_mode)::text = ANY ((ARRAY['road'::character varying, 'sea'::character varying, 'air'::character varying, 'rail'::character varying, 'inland_waterway'::character varying])::text[])))
);


--
-- Name: shipment_shipment_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.shipment_shipment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: shipment_shipment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.shipment_shipment_id_seq OWNED BY public.shipment.shipment_id;


--
-- Name: supplier; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.supplier (
    supplier_id integer NOT NULL,
    name character varying(200) NOT NULL,
    country character varying(100),
    sustainability_rating numeric(3,1),
    verified boolean DEFAULT false,
    last_submission_date date,
    CONSTRAINT supplier_sustainability_rating_check CHECK (((sustainability_rating >= (0)::numeric) AND (sustainability_rating <= (10)::numeric)))
);


--
-- Name: supplier_relationship; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.supplier_relationship (
    company_id integer NOT NULL,
    supplier_id integer NOT NULL,
    since_date date
);


--
-- Name: supplier_supplier_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.supplier_supplier_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: supplier_supplier_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.supplier_supplier_id_seq OWNED BY public.supplier.supplier_id;


--
-- Name: v_compliance_status; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_compliance_status AS
 SELECT cr.record_id,
    c.company_id,
    c.name AS company_name,
    rf.name AS framework_name,
    rf.jurisdiction,
    rf.target_year,
    cr.reporting_period,
    cr.target_co2e,
    cr.actual_co2e,
    cr.status,
    round(
        CASE
            WHEN (cr.target_co2e > (0)::numeric) THEN (((cr.actual_co2e - cr.target_co2e) / cr.target_co2e) * (100)::numeric)
            ELSE NULL::numeric
        END, 2) AS over_target_pct
   FROM ((public.compliance_record cr
     JOIN public.company c ON ((cr.company_id = c.company_id)))
     JOIN public.regulatory_framework rf ON ((cr.framework_id = rf.framework_id)));


--
-- Name: v_emission_intensity_by_supplier; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_emission_intensity_by_supplier AS
 SELECT s.supplier_id,
    s.name AS supplier_name,
    s.country,
    ea.activity_type AS product_category,
    count(*) AS activity_count,
    sum(ea.co2e_kg) AS total_co2e,
    round((sum(ea.co2e_kg) / (NULLIF(count(*), 0))::numeric), 4) AS co2e_per_unit
   FROM (public.supplier s
     JOIN public.emission_activity ea ON ((ea.supplier_id = s.supplier_id)))
  GROUP BY s.supplier_id, s.name, s.country, ea.activity_type;


--
-- Name: v_monthly_emission_trend; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_monthly_emission_trend AS
 SELECT c.company_id,
    c.name AS company_name,
    date_trunc('month'::text, (ea.activity_date)::timestamp with time zone) AS month,
    sum(ea.co2e_kg) AS total_co2e,
    lag(sum(ea.co2e_kg)) OVER (PARTITION BY c.company_id ORDER BY (date_trunc('month'::text, (ea.activity_date)::timestamp with time zone))) AS prev_month_co2e,
    round((((sum(ea.co2e_kg) - lag(sum(ea.co2e_kg)) OVER (PARTITION BY c.company_id ORDER BY (date_trunc('month'::text, (ea.activity_date)::timestamp with time zone)))) / NULLIF(lag(sum(ea.co2e_kg)) OVER (PARTITION BY c.company_id ORDER BY (date_trunc('month'::text, (ea.activity_date)::timestamp with time zone))), (0)::numeric)) * (100)::numeric), 2) AS mom_change_pct
   FROM ((public.emission_activity ea
     JOIN public.facility f ON ((ea.facility_id = f.facility_id)))
     JOIN public.company c ON ((f.company_id = c.company_id)))
  GROUP BY c.company_id, c.name, (date_trunc('month'::text, (ea.activity_date)::timestamp with time zone));


--
-- Name: v_offset_net_balance; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_offset_net_balance AS
 SELECT c.company_id,
    c.name AS company_name,
    date_trunc('quarter'::text, (ea.activity_date)::timestamp with time zone) AS quarter,
    COALESCE(sum(ea.co2e_kg), (0)::numeric) AS gross_emissions_co2e,
    COALESCE(sum(co.credits_retired), (0)::numeric) AS retired_credits,
    (COALESCE(sum(ea.co2e_kg), (0)::numeric) - COALESCE(sum(co.credits_retired), (0)::numeric)) AS net_co2e
   FROM (((public.company c
     LEFT JOIN public.facility f ON ((f.company_id = c.company_id)))
     LEFT JOIN public.emission_activity ea ON ((ea.facility_id = f.facility_id)))
     LEFT JOIN public.carbon_offset co ON (((co.company_id = c.company_id) AND (date_trunc('quarter'::text, (co.purchase_date)::timestamp with time zone) = date_trunc('quarter'::text, (ea.activity_date)::timestamp with time zone)))))
  GROUP BY c.company_id, c.name, (date_trunc('quarter'::text, (ea.activity_date)::timestamp with time zone));


--
-- Name: v_supplier_risk_ranking; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_supplier_risk_ranking AS
 SELECT s.supplier_id,
    s.name AS supplier_name,
    s.country,
    s.sustainability_rating,
    s.verified,
    COALESCE(sum(ea.co2e_kg), (0)::numeric) AS total_scope3_co2e,
    rank() OVER (ORDER BY COALESCE(sum(ea.co2e_kg), (0)::numeric) DESC) AS risk_rank
   FROM (public.supplier s
     LEFT JOIN public.emission_activity ea ON (((ea.supplier_id = s.supplier_id) AND (ea.scope = 3))))
  GROUP BY s.supplier_id, s.name, s.country, s.sustainability_rating, s.verified;


--
-- Name: v_supplier_verification_lag; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_supplier_verification_lag AS
 SELECT s.supplier_id,
    s.name AS supplier_name,
    s.country,
    s.sustainability_rating,
    s.verified,
    s.last_submission_date,
    (CURRENT_DATE - s.last_submission_date) AS days_since_submission,
        CASE
            WHEN (s.last_submission_date IS NULL) THEN 'Never submitted'::text
            WHEN ((CURRENT_DATE - s.last_submission_date) > 90) THEN 'Overdue (>90 days)'::text
            WHEN ((CURRENT_DATE - s.last_submission_date) > 30) THEN 'Late (>30 days)'::text
            ELSE 'Recent'::text
        END AS submission_status
   FROM public.supplier s
  WHERE ((s.verified = false) OR (s.last_submission_date IS NULL) OR ((CURRENT_DATE - s.last_submission_date) > 30))
  ORDER BY (CURRENT_DATE - s.last_submission_date) DESC;


--
-- Name: v_transport_mode_comparison; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_transport_mode_comparison AS
 SELECT shipment.transport_mode,
    count(*) AS shipment_count,
    sum(shipment.co2e_kg) AS total_co2e,
    sum(((shipment.distance_km * shipment.weight_kg) / 1000.0)) AS total_tonne_km,
    round((sum(shipment.co2e_kg) / NULLIF(sum(((shipment.distance_km * shipment.weight_kg) / 1000.0)), (0)::numeric)), 6) AS co2e_per_tonne_km
   FROM public.shipment
  WHERE ((shipment.distance_km > (0)::numeric) AND (shipment.weight_kg > (0)::numeric))
  GROUP BY shipment.transport_mode;


--
-- Name: app_user user_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_user ALTER COLUMN user_id SET DEFAULT nextval('public.app_user_user_id_seq'::regclass);


--
-- Name: audit_log log_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log ALTER COLUMN log_id SET DEFAULT nextval('public.audit_log_log_id_seq'::regclass);


--
-- Name: carbon_offset offset_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carbon_offset ALTER COLUMN offset_id SET DEFAULT nextval('public.carbon_offset_offset_id_seq'::regclass);


--
-- Name: company company_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company ALTER COLUMN company_id SET DEFAULT nextval('public.company_company_id_seq'::regclass);


--
-- Name: compliance_record record_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.compliance_record ALTER COLUMN record_id SET DEFAULT nextval('public.compliance_record_record_id_seq'::regclass);


--
-- Name: emission_activity activity_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emission_activity ALTER COLUMN activity_id SET DEFAULT nextval('public.emission_activity_activity_id_seq'::regclass);


--
-- Name: facility facility_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facility ALTER COLUMN facility_id SET DEFAULT nextval('public.facility_facility_id_seq'::regclass);


--
-- Name: regulatory_framework framework_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regulatory_framework ALTER COLUMN framework_id SET DEFAULT nextval('public.regulatory_framework_framework_id_seq'::regclass);


--
-- Name: shipment shipment_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipment ALTER COLUMN shipment_id SET DEFAULT nextval('public.shipment_shipment_id_seq'::regclass);


--
-- Name: supplier supplier_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier ALTER COLUMN supplier_id SET DEFAULT nextval('public.supplier_supplier_id_seq'::regclass);


--
-- Data for Name: app_user; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.app_user (user_id, company_id, email, password_hash, role, full_name, created_at) FROM stdin;
1	48	ashleewashington@example.com	abb635b079a6041725aaabac21124bfb2c95b925f432dacc4f9130a03045750f	supplier	Amber Sims	2026-05-03 12:59:39.677631+00
2	46	ksmith@example.com	a9a58c2e1e6d4ee4373bbe01553069a81c578fe766da8321945f4fd799db8c9b	supplier	Jessica Forbes DVM	2026-05-03 12:59:39.677631+00
3	25	erik41@example.net	1edfb01c0dc8c4d5ed4fffad5ffb80e2a79dd2bd9a9067431deec525d978df5a	manager	Matthew Banks	2026-05-03 12:59:39.677631+00
4	32	sanderskevin@example.net	e68d6c585987f3b41dda9776819fa01dacb42114e680067531eacd41509341c5	admin	Brandon Davis	2026-05-03 12:59:39.677631+00
5	9	thomasanderson@example.org	d6b2644568a5e70f3ae74f1f045e96e8737c8cf174275aa8e8802185fb7c6ae6	viewer	Adam Cooper	2026-05-03 12:59:39.677631+00
6	38	mcneilrobert@example.org	fe087018cb917010a1d2b1d08486fa234141d601610266312389d2668aa5335e	analyst	Brandon Shaffer	2026-05-03 12:59:39.677631+00
7	7	edwardsnicole@example.org	e146acf278290e6949e66a19684fc9e71355e33e2ccee5c298fcc989ebf4fe79	supplier	Shelly May	2026-05-03 12:59:39.677631+00
8	7	caseyelliott@example.net	09069530b5cbba0bb184381db5e64b9db776812c78c514b9ba3e3b1cd80fd1c3	viewer	Nathan Fuller	2026-05-03 12:59:39.677631+00
9	30	samanthajensen@example.com	e226d08f7161f55ba4e90ee2024e8d89253f933c22daebd915977348d295580c	admin	Brian Goodwin	2026-05-03 12:59:39.677631+00
10	47	bbell@example.com	4ab15e502d6f777b921167c036d3bde2ef291c9537ab19584d276be6c1535d3c	manager	Matthew Wright	2026-05-03 12:59:39.677631+00
11	27	kimberly04@example.org	a9a4258a97d6d8426f31e80b66472ced33b2e17401ca4223694c326926ef0f13	manager	Nicole Phillips	2026-05-03 12:59:39.677631+00
12	5	bowerslaura@example.org	0d74197df26454bb7f5b4d91bc0af4bcd12532b2d86951f19d0b532c14e2b0b9	supplier	Jonathan Wheeler	2026-05-03 12:59:39.677631+00
13	17	hatfieldsarah@example.org	c4274b4c1f15ef6903d8176f3bb057a0c780183036a3158d9d3dd5b039978c60	analyst	Jennifer Payne	2026-05-03 12:59:39.677631+00
14	40	kathrynbest@example.org	c6d3747121e7d7a78de2d57741b6647656de40c16593d0b0fe7a66d5187870f8	supplier	Dennis Williams	2026-05-03 12:59:39.677631+00
15	42	fryraymond@example.com	06e09cca7300cfc6a2b4352ba85c9988a8bdabefbe2ae0a57c014b0901550b69	admin	Jennifer Miles	2026-05-03 12:59:39.677631+00
16	22	davidsonamanda@example.org	caef8ec9665ec3e749dfc874690a59752bd5a741af1cc2dd363a9e1d768227f9	viewer	Jorge Harris	2026-05-03 12:59:39.677631+00
17	25	amandamyers@example.net	397923db747fb71da3bb0d45d78493d801a9b00f0241105bcbe01c2b1c0ce94b	analyst	Maria Collins	2026-05-03 12:59:39.677631+00
18	41	pblair@example.org	87221ca7b95da0af8c4581e049bde76a0615ab428db5d27006adf6314e75ceaf	supplier	Audrey Salazar	2026-05-03 12:59:39.677631+00
19	35	parkerjudith@example.net	aca0d1d5cc8a33c7f993a9ef5469399381198d435ca6bf8fb56dd08f92228143	admin	Chad Smith	2026-05-03 12:59:39.677631+00
20	40	hbenton@example.net	30e33aa611ece34f6f8bc191e8df118b348a0cfe492cd404a2c690e1f49323ae	admin	Carol Martinez	2026-05-03 12:59:39.677631+00
\.


--
-- Data for Name: audit_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_log (log_id, user_id, action, table_name, record_id, "timestamp", details) FROM stdin;
1	112	UPDATE	compliance_record	486	2026-05-03 12:59:42.381306+00	{"note": "Bank sit none now beyond measure.", "changed_by": "James Jones"}
2	139	DELETE	carbon_offset	569	2026-05-03 12:59:42.381306+00	{"note": "Quality everyone benefit fill sit fund public.", "changed_by": "Donald Weaver"}
3	182	UPDATE	facility	654	2026-05-03 12:59:42.381306+00	{"note": "Service service military popular production live key.", "changed_by": "James Flores"}
4	154	UPDATE	shipment	627	2026-05-03 12:59:42.381306+00	{"note": "Loss gun field.", "changed_by": "Mariah Erickson"}
5	114	INSERT	shipment	831	2026-05-03 12:59:42.381306+00	{"note": "Development she Mr price big.", "changed_by": "Rebecca Thompson"}
6	152	INSERT	supplier	376	2026-05-03 12:59:42.381306+00	{"note": "Rise stop enter partner.", "changed_by": "Katelyn Potts"}
7	144	INSERT	compliance_record	176	2026-05-03 12:59:42.381306+00	{"note": "Fear both decision order level.", "changed_by": "Mary Rodriguez DVM"}
8	141	UPDATE	emission_activity	539	2026-05-03 12:59:42.381306+00	{"note": "Left teach short pass enjoy.", "changed_by": "Sabrina Hopkins"}
9	130	UPDATE	supplier	78	2026-05-03 12:59:42.381306+00	{"note": "Low common wall life matter husband billion.", "changed_by": "Matthew Simon"}
10	119	DELETE	emission_activity	668	2026-05-03 12:59:42.381306+00	{"note": "Finally hour forget possible life people finish.", "changed_by": "Charles Richardson"}
11	180	UPDATE	compliance_record	655	2026-05-03 12:59:42.381306+00	{"note": "Glass adult simple seek size student.", "changed_by": "Mr. Ross Cox"}
12	161	INSERT	compliance_record	349	2026-05-03 12:59:42.381306+00	{"note": "Best impact and skin travel significant energy.", "changed_by": "Paula Jenkins"}
13	123	UPDATE	shipment	388	2026-05-03 12:59:42.381306+00	{"note": "Degree save skin point know.", "changed_by": "John King"}
14	200	DELETE	shipment	454	2026-05-03 12:59:42.381306+00	{"note": "Young know respond effort without prove major speak.", "changed_by": "Danielle Carter"}
15	135	INSERT	shipment	331	2026-05-03 12:59:42.381306+00	{"note": "Glass floor future among require material exist.", "changed_by": "Jennifer Martinez"}
16	172	UPDATE	shipment	591	2026-05-03 12:59:42.381306+00	{"note": "Course station beyond.", "changed_by": "Gregory Byrd"}
17	154	INSERT	supplier	27	2026-05-03 12:59:42.381306+00	{"note": "Serious just along.", "changed_by": "Kenneth Lucas"}
18	120	DELETE	compliance_record	543	2026-05-03 12:59:42.381306+00	{"note": "Almost myself red concern more finish better.", "changed_by": "Brittney Curry"}
19	128	DELETE	facility	846	2026-05-03 12:59:42.381306+00	{"note": "Official sister professor side type interest.", "changed_by": "David Bolton"}
20	144	UPDATE	carbon_offset	865	2026-05-03 12:59:42.381306+00	{"note": "Main drive these somebody reflect organization.", "changed_by": "Anthony Anderson"}
21	101	DELETE	compliance_record	910	2026-05-03 12:59:42.381306+00	{"note": "Mrs establish be degree song star send.", "changed_by": "Angela Lopez"}
22	186	UPDATE	supplier	464	2026-05-03 12:59:42.381306+00	{"note": "Life tax close play wish dinner if public.", "changed_by": "John Ingram"}
23	153	UPDATE	shipment	538	2026-05-03 12:59:42.381306+00	{"note": "Increase shoulder this week environmental white cultural.", "changed_by": "Valerie Contreras"}
24	152	DELETE	shipment	701	2026-05-03 12:59:42.381306+00	{"note": "Trial purpose direction.", "changed_by": "Mark Bridges"}
25	170	UPDATE	shipment	163	2026-05-03 12:59:42.381306+00	{"note": "Sport hope agent company sure consider yard.", "changed_by": "Steven Ruiz"}
26	136	UPDATE	facility	814	2026-05-03 12:59:42.381306+00	{"note": "Watch remain son center media shake hospital voice.", "changed_by": "Robert Chambers"}
27	155	INSERT	emission_activity	319	2026-05-03 12:59:42.381306+00	{"note": "Someone coach enough price focus.", "changed_by": "James Leblanc"}
28	129	UPDATE	shipment	524	2026-05-03 12:59:42.381306+00	{"note": "Majority politics nothing without successful special tend hour.", "changed_by": "Emily Stuart"}
29	129	INSERT	supplier	27	2026-05-03 12:59:42.381306+00	{"note": "Pick help head Democrat hear standard exactly under.", "changed_by": "Brent Barton"}
30	153	DELETE	compliance_record	492	2026-05-03 12:59:42.381306+00	{"note": "Program share recent be high late memory.", "changed_by": "George Brown"}
\.


--
-- Data for Name: carbon_offset; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.carbon_offset (offset_id, company_id, project_name, certification_body, credits_purchased, credits_retired, purchase_date) FROM stdin;
1	24	Amazon Rainforest REDD+	VCS	627.9969	11.2187	2023-01-18
2	27	Solar Cookstoves Ghana	Gold Standard	1669.6739	1533.7633	2022-10-04
3	32	Methane Capture Brazil	VCS	811.1994	45.4064	2024-05-22
4	15	Solar Cookstoves Ghana	Gold Standard	846.0030	463.2400	2022-05-25
5	1	Methane Capture Brazil	VCS	1420.1252	747.6822	2024-03-19
6	1	Solar PV India	Gold Standard	1450.3773	595.7905	2024-03-21
7	24	Mangrove Restoration Indonesia	Plan Vivo	1510.9833	1274.8600	2022-10-20
8	26	Amazon Rainforest REDD+	VCS	1329.1038	588.3540	2024-09-13
9	38	Methane Capture Brazil	VCS	1489.7232	722.3085	2021-08-22
10	1	Nordic Reforestation	VCS	1995.0018	1222.8633	2023-09-09
11	26	Methane Capture Brazil	VCS	899.2042	884.6579	2024-03-15
12	1	Kenya Wind Farm	Gold Standard	288.3990	254.3527	2023-05-03
13	45	Ocean Kelp Farming	VCS	468.5906	171.4628	2023-09-04
14	7	Biogas Uganda	Gold Standard	800.0318	154.8722	2023-06-13
15	28	Kenya Wind Farm	Gold Standard	1331.1500	734.6213	2022-05-31
16	32	Amazon Rainforest REDD+	VCS	776.1979	754.7990	2023-05-14
17	6	Biogas Uganda	Gold Standard	1959.7905	1356.4725	2022-10-18
18	12	Kenya Wind Farm	Gold Standard	69.5231	6.2113	2024-08-30
19	4	Mangrove Restoration Indonesia	Plan Vivo	329.2374	20.3721	2022-10-03
20	46	Biogas Uganda	Gold Standard	1212.2620	270.9562	2021-09-13
\.


--
-- Data for Name: company; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.company (company_id, name, industry, country, tax_id, founded_year) FROM stdin;
1	Rodriguez, Figueroa and Sanchez	Logistics	Burundi	HQ181960013	1953
2	Johnson, Gonzalez and Santos	Technology	Mayotte	IE637940265	1981
3	Bernard LLC	Retail	Bosnia and Herzegovina	RD161559407	1967
4	Miller-Carter	Logistics	Niue	HD959310341	2019
5	Ramirez-Reid	Logistics	Haiti	XH255341928	2004
6	Ford LLC	Manufacturing	Uzbekistan	CG835030564	1953
7	Walter, Edwards and Rios	Logistics	Indonesia	NS724238849	1977
8	Cox-Osborn	Retail	Burundi	CM871012269	2014
9	Carlson-Mcdonald	Automotive	El Salvador	FO801845146	1953
10	Mckay Ltd	Chemicals	Estonia	LY828148932	1975
11	Ryan PLC	Chemicals	Uruguay	BH095701543	2003
12	Arroyo, Miller and Tucker	Retail	Bangladesh	NG822782489	2007
13	Campos, Vaughn and Marquez	Automotive	Iran	AS578713315	1985
14	Hall, Robinson and Jones	Manufacturing	Norfolk Island	VP031051834	1970
15	Ryan Ltd	Construction	Vietnam	VN997376311	1993
16	Henderson-Owens	Technology	Saint Lucia	RO010651333	1969
17	Henderson LLC	Retail	Kyrgyz Republic	YH317810801	1993
18	Russell Group	Logistics	Croatia	NW602606474	1961
19	Cowan, Peters and Higgins	Construction	Cape Verde	BS343098050	1962
20	Shaw-Farrell	Agriculture	Cayman Islands	DS081219136	1994
\.


--
-- Data for Name: compliance_record; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.compliance_record (record_id, company_id, framework_id, reporting_period, target_co2e, actual_co2e, status) FROM stdin;
1	36	17	2022-Q2	181789.3954	159240.6097	compliant
2	44	11	2021-Q1	155696.8655	133866.1317	compliant
3	33	1	2020-Q3	249282.0497	344751.5148	non_compliant
4	35	15	2024-Q3	240192.7056	169597.7462	compliant
5	45	1	2024-Q2	487744.7229	408041.7769	compliant
6	31	12	2023-Q3	185194.3795	166815.3391	compliant
7	26	20	2022-Q4	145631.3183	103331.4747	compliant
8	48	18	2021-Q1	106157.8671	121688.3413	non_compliant
9	24	15	2023-Q2	67846.4355	52828.5501	compliant
10	12	12	2020-Q3	154514.1549	151901.9779	compliant
11	6	8	2021-Q2	218441.4771	222106.8391	pending
12	43	20	2021-Q4	94484.3333	101755.2133	non_compliant
13	26	9	2021-Q2	248749.4731	185785.2082	compliant
14	29	2	2020-Q4	195931.9887	170258.2287	compliant
15	15	13	2023-Q1	454747.4066	350797.1723	compliant
16	43	5	2023-Q4	159719.1848	134786.6535	compliant
17	31	10	2020-Q1	205879.7794	159017.6552	compliant
18	32	8	2024-Q2	52266.8755	67962.4548	non_compliant
19	37	11	2022-Q2	191823.2636	231305.2189	non_compliant
20	24	6	2023-Q1	55669.8386	49568.3154	compliant
\.


--
-- Data for Name: emission_activity; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.emission_activity (activity_id, facility_id, supplier_id, recorded_by, scope, activity_type, co2e_kg, activity_date, notes, status, approved_by, approved_at) FROM stdin;
1	214	\N	171	2	Renewable Grid Electricity	3502.8245	2022-04-02	\N	pending	\N	\N
2	269	477	141	3	Upstream Transport - Sea	89159.4218	2023-01-31	May stop like mother stay tonight later.	pending	\N	\N
3	248	\N	193	2	District Cooling	8364.3972	2021-10-24	\N	pending	\N	\N
4	228	449	133	3	End-of-Life Treatment	153375.9357	2022-01-07	Son war speak wait assume throughout.	pending	\N	\N
5	251	\N	137	2	Grid Electricity	203.8734	2023-05-05	\N	pending	\N	\N
6	239	\N	128	1	Diesel Generator	825.1570	2024-10-18	\N	pending	\N	\N
7	289	436	172	3	Employee Commuting	183903.3045	2023-03-14	Beautiful hospital condition when baby clearly born.	pending	\N	\N
8	205	\N	118	1	Diesel Generator	23288.3054	2021-06-26	\N	pending	\N	\N
9	230	433	174	3	Purchased Goods - Plastics	162403.7731	2022-03-29	\N	pending	\N	\N
10	210	\N	123	1	Process Emissions	36317.2361	2022-09-26	Many themselves minute physical.	pending	\N	\N
11	274	413	105	3	Upstream Transport - Road	119451.0093	2024-02-05	Indicate radio use listen information.	pending	\N	\N
12	300	\N	145	2	District Heating	1307.2696	2024-12-06	Factor as the.	pending	\N	\N
13	216	\N	196	2	Renewable Grid Electricity	17421.7730	2023-08-29	Strong mind from official pretty.	pending	\N	\N
14	282	500	140	3	Purchased Goods - Steel	126806.5305	2022-12-09	\N	pending	\N	\N
15	220	442	120	3	Purchased Goods - Chemicals	100977.9205	2020-04-13	\N	pending	\N	\N
16	258	497	112	3	Employee Commuting	119431.3061	2021-03-30	\N	pending	\N	\N
17	219	417	174	3	Business Travel - Air	67897.4674	2024-03-06	\N	pending	\N	\N
18	211	\N	200	2	District Cooling	8090.8353	2023-11-30	\N	pending	\N	\N
19	272	\N	184	1	Process Emissions	10306.3721	2023-03-16	\N	pending	\N	\N
20	295	468	135	3	Purchased Goods - Plastics	50002.9223	2024-05-09	\N	pending	\N	\N
21	274	412	155	3	Upstream Transport - Air	23393.4444	2022-01-18	\N	pending	\N	\N
22	277	\N	122	2	District Heating	13177.1152	2021-12-17	\N	pending	\N	\N
23	257	480	130	3	Purchased Goods - Steel	30017.8766	2021-02-12	\N	pending	\N	\N
24	294	\N	195	1	Natural Gas Boiler	42711.8252	2020-04-21	\N	pending	\N	\N
25	219	437	115	3	End-of-Life Treatment	3732.9252	2021-09-16	\N	pending	\N	\N
26	227	\N	127	1	Diesel Generator	37130.6428	2023-01-24	\N	pending	\N	\N
27	262	\N	189	2	Renewable Grid Electricity	12536.2315	2023-12-02	\N	pending	\N	\N
28	285	\N	122	2	District Heating	10630.6220	2020-05-03	\N	pending	\N	\N
29	280	435	102	3	Use of Sold Products	11563.9645	2020-05-16	\N	pending	\N	\N
30	285	\N	103	2	Grid Electricity	7332.3390	2021-08-22	Main program morning nature leader note.	pending	\N	\N
31	230	449	113	3	End-of-Life Treatment	102199.5261	2021-10-08	\N	pending	\N	\N
32	212	424	172	3	Business Travel - Air	40576.1648	2023-12-30	\N	pending	\N	\N
33	268	\N	151	1	Process Emissions	15593.9124	2024-03-04	\N	pending	\N	\N
34	246	\N	131	2	District Heating	7236.4870	2022-10-23	\N	pending	\N	\N
35	233	\N	172	1	Natural Gas Boiler	43994.5251	2021-07-27	\N	pending	\N	\N
36	251	\N	194	2	Grid Electricity	13207.2488	2022-02-21	\N	pending	\N	\N
37	281	488	174	3	Purchased Goods - Chemicals	46258.1675	2020-11-08	\N	pending	\N	\N
38	278	\N	127	2	Renewable Grid Electricity	6719.8378	2023-08-29	\N	pending	\N	\N
39	226	418	168	3	End-of-Life Treatment	62490.6808	2020-10-03	\N	pending	\N	\N
40	299	419	121	3	Waste in Operations	131590.1189	2021-10-12	\N	pending	\N	\N
41	293	416	194	3	Purchased Goods - Electronics	37642.9080	2020-03-01	Commercial employee machine wife show.	pending	\N	\N
42	253	453	182	3	End-of-Life Treatment	61366.2729	2024-02-21	\N	pending	\N	\N
43	214	417	179	3	Waste in Operations	37764.5528	2021-06-30	\N	pending	\N	\N
45	265	\N	192	2	District Cooling	16953.5371	2023-08-23	\N	pending	\N	\N
46	263	461	129	3	Purchased Goods - Chemicals	28365.0317	2020-03-07	\N	pending	\N	\N
47	235	453	126	3	Use of Sold Products	45288.2883	2024-03-31	\N	pending	\N	\N
48	257	\N	189	1	Process Emissions	43422.8856	2021-10-27	Chance expect what.	pending	\N	\N
49	255	452	195	3	Waste in Operations	155466.7291	2024-08-15	\N	pending	\N	\N
50	279	\N	167	2	Grid Electricity	18794.9548	2020-08-11	\N	pending	\N	\N
51	206	432	195	3	Upstream Transport - Air	104221.8279	2020-03-21	\N	pending	\N	\N
\.


--
-- Data for Name: facility; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.facility (facility_id, company_id, name, location, facility_type, size_sqm) FROM stdin;
1	17	Vaughn Ltd Facility	Westtown, BW	farm	21707.47
2	38	Walker-Holt Facility	Elizabethstad, PY	port	18418.82
3	9	Schmidt, Coleman and Reese Facility	Michaelmouth, IR	farm	24929.03
4	49	King-Martinez Facility	West David, SO	warehouse	43124.59
5	10	Lopez, Robinson and Washington Facility	Tinaborough, KE	factory	39707.93
6	28	Ward LLC Facility	Lake Amandaview, BD	farm	3644.62
7	25	Tran Ltd Facility	Lake Miranda, RW	farm	49808.01
8	34	Salas PLC Facility	Taylormouth, LV	office	48568.38
9	1	Sheppard LLC Facility	Wilsonland, MZ	warehouse	34244.66
10	35	Jones-Soto Facility	East Edwardshire, KI	office	38545.64
11	22	Mcknight Inc Facility	Obrienbury, SK	warehouse	15028.26
12	11	Hayes-Ramos Facility	Torreston, VA	port	660.64
13	47	Garcia, Farmer and Garrett Facility	Donnaburgh, GY	office	48608.46
14	49	Arnold and Sons Facility	South Shannonfort, JP	factory	25630.24
15	7	Hall Ltd Facility	Jacquelinemouth, BN	office	42162.63
16	33	Hall, Baker and Moody Facility	South Danny, GR	farm	10346.10
17	24	Hernandez, Baker and Thomas Facility	East Laurashire, JO	factory	27199.26
19	39	Kim-George Facility	Navarroview, AR	office	24685.98
20	8	Perez Ltd Facility	Port Emilyview, TR	office	43996.73
21	20	Hines and Sons Facility	Stonemouth, IT	factory	3367.30
\.


--
-- Data for Name: regulatory_framework; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.regulatory_framework (framework_id, name, jurisdiction, target_year) FROM stdin;
1	GHG Protocol	Global	2050
2	ISO 14064	Global	2030
3	EU CSRD	European Union	2030
4	EU ETS	European Union	2030
5	SEC Climate Rule	USA	2025
6	UK SECR	United Kingdom	2030
7	TCFD	Global	2030
8	Science Based Targets (SBTi)	Global	2050
9	CDP Climate	Global	2030
10	Paris Agreement NDC	Global	2030
11	California AB 32	USA	2030
12	Australia NGER	Australia	2030
13	Japan GHG Reporting	Japan	2030
14	Canada OBPS	Canada	2030
15	South Korea ETS	South Korea	2030
16	China National ETS	China	2030
17	Switzerland CO2 Act	Switzerland	2030
18	New Zealand ETS	New Zealand	2050
19	Singapore Carbon Tax	Singapore	2030
20	India PAT Scheme	India	2030
\.


--
-- Data for Name: shipment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shipment (shipment_id, supplier_id, company_id, transport_mode, distance_km, weight_kg, co2e_kg, shipment_date) FROM stdin;
1	490	10	air	16794.15	30670.91	310085.3016	2024-12-04
2	423	12	road	19183.27	27833.22	33103.7948	2023-11-06
3	408	13	air	19049.93	10086.35	115670.8454	2023-07-29
4	481	19	inland_waterway	13219.81	5719.70	1436.6536	2023-07-17
5	437	46	sea	11434.15	4906.99	448.8581	2024-12-18
6	408	38	air	16088.72	15047.17	145738.0024	2022-04-03
7	459	21	road	21888.39	2189.98	2971.9785	2020-04-22
9	465	1	sea	4065.19	6015.88	195.6456	2022-04-25
10	465	5	rail	12370.93	66228.86	18024.8770	2022-11-13
11	481	5	inland_waterway	24490.70	1004.25	467.3009	2022-03-27
12	456	33	sea	17257.72	79175.24	10931.0730	2021-07-10
13	431	14	sea	21758.28	73461.65	12787.1932	2022-06-14
14	431	21	road	13700.54	46950.14	39881.0208	2021-11-28
15	447	30	inland_waterway	22358.64	57831.24	24567.5296	2020-11-28
16	471	8	rail	3660.77	39446.39	3176.8915	2023-09-07
17	415	47	inland_waterway	19745.01	20523.68	7699.5651	2021-09-15
18	487	16	rail	9531.98	64605.08	13547.9153	2022-11-09
19	463	4	road	3987.40	65098.38	16093.5434	2024-05-23
20	455	30	inland_waterway	7270.70	5667.62	782.9437	2023-10-21
21	498	18	rail	2237.70	59439.63	2926.1773	2020-05-28
22	407	17	inland_waterway	3136.19	73600.72	4385.6910	2024-12-15
23	485	15	inland_waterway	14486.68	12193.79	3356.3031	2022-05-29
24	404	48	sea	19254.46	11855.35	1826.1469	2023-09-16
25	466	1	sea	15188.45	48114.63	5846.2932	2024-05-26
26	420	48	road	5351.51	23856.65	7915.4843	2024-08-20
27	432	35	road	23472.64	34775.66	50609.1460	2024-01-27
28	480	28	rail	9713.81	27653.87	5909.7377	2022-02-05
29	459	2	sea	11118.14	31094.99	2765.7476	2021-05-11
30	462	20	inland_waterway	21686.69	73703.32	30369.2400	2023-06-25
31	470	16	inland_waterway	2191.19	18614.33	774.9631	2023-06-17
\.


--
-- Data for Name: supplier; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.supplier (supplier_id, name, country, sustainability_rating, verified, last_submission_date) FROM stdin;
1	Dawson-Harper	Yemen	8.1	t	2023-07-02
2	Bowman Group	Algeria	0.3	f	2023-09-25
3	Jefferson PLC	France	9.2	f	\N
4	Johnson PLC	Malawi	8.7	f	\N
5	Hale, Gilbert and Craig	Guyana	7.4	t	\N
6	Pena and Sons	Benin	5.3	f	2023-11-30
7	Chan-Gomez	Indonesia	1.6	f	2022-06-23
8	Willis-Holmes	Saint Pierre and Miquelon	8.8	t	2022-04-12
9	Jones, Davis and Mitchell	Switzerland	6.7	f	2024-05-18
10	Herman, Bailey and Richmond	Falkland Islands (Malvinas)	4.9	f	2023-03-18
11	Obrien and Sons	Korea	7.5	t	2022-08-16
12	Andrews-Green	Ireland	2.8	f	2023-09-24
13	Rodriguez, Jones and Phillips	Yemen	0.5	f	2022-04-23
14	Pratt LLC	Turkey	0.1	f	2022-10-09
15	Li, Andrews and Benson	Honduras	7.6	f	2022-01-16
16	Webb, Sanchez and Morgan	Singapore	5.0	f	2024-02-18
17	Maldonado-Mosley	Tokelau	5.3	t	2023-12-27
18	Olson LLC	Bangladesh	0.7	t	2024-07-30
19	Schultz-Gamble	Philippines	9.2	f	2024-04-08
20	Hall, Stewart and Moses	Maldives	7.1	f	2024-04-09
21	Smith, Collier and Wright	Bermuda	0.2	f	2024-07-31
22	Nunez-Nicholson	Belarus	8.3	f	\N
23	Velazquez, Woods and Gomez	Uganda	8.4	t	2024-03-31
24	Adams, Valentine and Vega	United States of America	5.2	f	2023-11-27
25	Porter and Sons	Dominica	2.2	t	\N
26	Allen, Baker and Perez	Syrian Arab Republic	6.3	t	2023-12-17
27	Huff LLC	Cape Verde	3.5	t	2022-10-27
28	Wilson Inc	Philippines	2.6	t	2022-06-04
29	Vasquez, Smith and Vincent	Armenia	1.8	f	2024-07-08
30	Watson-Stewart	Ukraine	6.8	f	2023-10-10
\.


--
-- Data for Name: supplier_relationship; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.supplier_relationship (company_id, supplier_id, since_date) FROM stdin;
17	467	2022-07-03
5	465	2020-11-17
40	432	2019-06-12
28	467	2022-11-30
17	485	2021-01-06
6	448	2022-07-24
11	414	2022-06-13
28	485	2021-03-23
29	459	2019-05-28
9	490	2021-11-22
21	455	2020-06-25
44	420	2020-02-12
40	468	2021-02-27
41	433	2020-09-17
41	442	2019-05-14
2	423	2022-04-01
33	438	2019-11-27
2	432	2022-05-08
3	406	2020-07-28
39	490	2021-10-27
45	421	2020-08-01
2	450	2021-04-16
2	459	2022-11-01
12	500	2018-02-26
35	465	2020-09-14
4	496	2018-08-27
43	487	2019-06-13
1	481	2018-05-19
32	496	2020-02-23
13	492	2021-07-21
\.


--
-- Name: app_user_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.app_user_user_id_seq', 218, true);


--
-- Name: audit_log_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.audit_log_log_id_seq', 2500, true);


--
-- Name: carbon_offset_offset_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.carbon_offset_offset_id_seq', 300, true);


--
-- Name: company_company_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.company_company_id_seq', 52, true);


--
-- Name: compliance_record_record_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.compliance_record_record_id_seq', 400, true);


--
-- Name: emission_activity_activity_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.emission_activity_activity_id_seq', 10518, true);


--
-- Name: facility_facility_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.facility_facility_id_seq', 300, true);


--
-- Name: regulatory_framework_framework_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.regulatory_framework_framework_id_seq', 20, true);


--
-- Name: shipment_shipment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.shipment_shipment_id_seq', 5200, true);


--
-- Name: supplier_supplier_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.supplier_supplier_id_seq', 500, true);


--
-- Name: app_user app_user_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_user
    ADD CONSTRAINT app_user_email_key UNIQUE (email);


--
-- Name: app_user app_user_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_user
    ADD CONSTRAINT app_user_pkey PRIMARY KEY (user_id);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (log_id);


--
-- Name: carbon_offset carbon_offset_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carbon_offset
    ADD CONSTRAINT carbon_offset_pkey PRIMARY KEY (offset_id);


--
-- Name: company company_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company
    ADD CONSTRAINT company_pkey PRIMARY KEY (company_id);


--
-- Name: company company_tax_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company
    ADD CONSTRAINT company_tax_id_key UNIQUE (tax_id);


--
-- Name: compliance_record compliance_record_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.compliance_record
    ADD CONSTRAINT compliance_record_pkey PRIMARY KEY (record_id);


--
-- Name: emission_activity emission_activity_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emission_activity
    ADD CONSTRAINT emission_activity_pkey PRIMARY KEY (activity_id);


--
-- Name: facility facility_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facility
    ADD CONSTRAINT facility_pkey PRIMARY KEY (facility_id);


--
-- Name: regulatory_framework regulatory_framework_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regulatory_framework
    ADD CONSTRAINT regulatory_framework_pkey PRIMARY KEY (framework_id);


--
-- Name: shipment shipment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipment
    ADD CONSTRAINT shipment_pkey PRIMARY KEY (shipment_id);


--
-- Name: supplier supplier_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier
    ADD CONSTRAINT supplier_pkey PRIMARY KEY (supplier_id);


--
-- Name: supplier_relationship supplier_relationship_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_relationship
    ADD CONSTRAINT supplier_relationship_pkey PRIMARY KEY (company_id, supplier_id);


--
-- Name: app_user app_user_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_user
    ADD CONSTRAINT app_user_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(company_id) ON DELETE CASCADE;


--
-- Name: audit_log audit_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.app_user(user_id) ON DELETE SET NULL;


--
-- Name: carbon_offset carbon_offset_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carbon_offset
    ADD CONSTRAINT carbon_offset_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(company_id) ON DELETE CASCADE;


--
-- Name: compliance_record compliance_record_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.compliance_record
    ADD CONSTRAINT compliance_record_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(company_id) ON DELETE CASCADE;


--
-- Name: compliance_record compliance_record_framework_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.compliance_record
    ADD CONSTRAINT compliance_record_framework_id_fkey FOREIGN KEY (framework_id) REFERENCES public.regulatory_framework(framework_id);


--
-- Name: emission_activity emission_activity_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emission_activity
    ADD CONSTRAINT emission_activity_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.app_user(user_id) ON DELETE SET NULL;


--
-- Name: emission_activity emission_activity_facility_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emission_activity
    ADD CONSTRAINT emission_activity_facility_id_fkey FOREIGN KEY (facility_id) REFERENCES public.facility(facility_id) ON DELETE CASCADE;


--
-- Name: emission_activity emission_activity_recorded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emission_activity
    ADD CONSTRAINT emission_activity_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES public.app_user(user_id) ON DELETE SET NULL;


--
-- Name: emission_activity emission_activity_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emission_activity
    ADD CONSTRAINT emission_activity_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.supplier(supplier_id) ON DELETE SET NULL;


--
-- Name: facility facility_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facility
    ADD CONSTRAINT facility_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(company_id) ON DELETE CASCADE;


--
-- Name: shipment shipment_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipment
    ADD CONSTRAINT shipment_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(company_id) ON DELETE CASCADE;


--
-- Name: shipment shipment_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipment
    ADD CONSTRAINT shipment_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.supplier(supplier_id) ON DELETE SET NULL;


--
-- Name: supplier_relationship supplier_relationship_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_relationship
    ADD CONSTRAINT supplier_relationship_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(company_id) ON DELETE CASCADE;


--
-- Name: supplier_relationship supplier_relationship_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_relationship
    ADD CONSTRAINT supplier_relationship_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.supplier(supplier_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict s7NrtTY8Q2ExqpUiQh7F9AQjhs8iFX1W3yB20vtz0qkFCgDSaIy6eVnkk7kf9Uq

