import time
import os
import json
from openai import OpenAI
from dotenv import load_dotenv
from logger_config import logger

load_dotenv()

class AIClassifier:
    def __init__(self):
        base_url = os.getenv("OPENAI_BASE_URL")
        if base_url:
            self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"), base_url=base_url, timeout=60.0)
            logger.info(f"Connecting to custom LLM endpoint: {base_url} with 60s timeout")
        else:
            self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"), timeout=60.0)
            
        # Load model from .env, default to gpt-4o-mini if not set
        self.model = os.getenv("AI_MODEL", "gpt-4o-mini")   
        logger.info(f"AI Classifier initialized using model: {self.model}")

    def classify_candidate(self, cv_text, guide_json=None, expected_name="Unknown"):
        logger.info(f"Starting Specialist Recruitment Screening for: {expected_name}...")

        from datetime import datetime
        current_date_str = datetime.now().strftime("%B %Y") # e.g. "July 2026"

        logger.info(f"Starting Specialist Recruitment Screening for: {expected_name}...")

        from datetime import datetime
        current_date_str = datetime.now().strftime("%B %Y") # e.g. "July 2026"

        
        system_prompt = f"""
You are a specialist recruitment screening AI for Bid and Proposal roles within the Construction sector.
EXPECTED CANDIDATE: {expected_name}
CURRENT DATE FOR TENURE CALCULATIONS: {current_date_str}
Your job is to classify ONLY WHITE-COLLAR candidates based on specific criteria.

You must follow a STRICT STEP-BY-STEP FILTERING PROCESS.

---

## STEP 1 — CURRENT POSITION CHECK (MANDATORY)

First identify the candidate’s CURRENT or MOST RECENT job title explicitly from the **Work Experience / Employment History** section of the CV text.
When determining the current role, use the most recent RELEVANT professional employment entry. If the candidate's absolute most recent role is clearly a temporary stopgap (e.g., retail, delivery), volunteering, or an unrelated career break, ignore it and evaluate their most recent professional career role.

ONLY continue evaluation if the current/recent position clearly matches one of these TARGET JOB TITLES:
* Bid Administrator / Proposal Administrator / Proposals Administrator
* Bid Writer / Proposal Writer / Proposals Writer
* Bid Coordinator / Bid Co-ordinator / Proposal Coordinator / Proposal Co-ordinator / Proposals Coordinator
* Bid Manager / Proposal Manager / Proposals Manager
* Bid Lead / Proposal Lead / Proposals Lead
* Head of Bids / Head of Proposals
* Bid Director / Proposal Director / Proposals Director
* PQQ Coordinator / PQQ Manager

If the CURRENT or MOST RECENT role does NOT closely match these target titles:
* Immediately classify as UNFIT
* Do not continue further evaluation

NOTE: Slight semantic variations, expanded titles, or prefixes/suffixes are ACCEPTABLE, provided they clearly align with the target Bid or Proposal career path.

---

## STEP 2 — COMPANY SECTOR / RELEVANCE CHECK (MANDATORY)

Check the types of companies the candidate has worked for recently.

TARGET COMPANIES INCLUDE:
* General Construction Companies
* Building Contractors
* Commercial Construction Companies
* Regional Construction Companies
* SME Construction Companies

---

## STEP 3 — MUST-HAVE CRITERIA CHECK

The candidate should demonstrate a strong majority of the following:
* Experience managing tender submissions, PQQs, ITTs, RFQs, and proposal documentation.
* Current or recent experience within a general construction company.
* Strong understanding of construction bid processes and frameworks.

PRIORITISE candidates showing:
* Candidates with successful tender and framework submission experience.
* Experience progressing from Bid Coordinator to Bid Manager or Bid Director.
* Experience supporting business growth through winning bids and tenders.

If the candidate clearly fails these must-have requirements:
* Classify as UNFIT

---

## STEP 4 — RED FLAGS CHECK

Immediately classify as UNFIT if any of these are strongly present:
* Main contractor-only backgrounds.
* Specialist subcontractor backgrounds.
* Sales-only or marketing-only professionals.
* Recruitment, IT, healthcare, or non-construction bid professionals.
---
## FINAL DECISION FORMAT
You must respond with ONLY a valid JSON object matching the following structure:
{{
  "candidate_name": "Full name of the candidate (if available, else Unknown)",
  "current_company": "The candidate's current or most recent company/employer name (if available, else null)",
  "current_position": "The candidate's current or most recent job title",
  "location": "The candidate's location/city (if available, else Unknown)",
  "classification": "FIT" or "UNFIT",
  "reasoning": "A concise paragraph explaining exactly why the candidate was classified as FIT or UNFIT based on the steps above.",
  "t1_tenure": "The tenure/duration of the candidate's current or most recent job/role in elapsed months (exclusive of the starting month, e.g. Aug 2025 to May 2026 is 9 months). If the role ends in 'Current' or 'Present', calculate elapsed months relative to the current date ({{current_date_str}}). Calculated from the dates on the CV. Use null if not available.",
  "t2_tenure": "The tenure/duration of the candidate's second most recent job/role (previous job) in elapsed months (exclusive of the starting month, e.g. Oct 2024 to Jun 2025 is 8 months). If the role is ongoing or ends in 'Current'/'Present', calculate relative to {{current_date_str}}. Calculated from the dates on the CV. Use null if not available.",
  "business_specialization": "string matching the sector or specialty, e.g. Bid",
  "linkedin_url": "string link or null",
  "salary_range": "The candidate's salary range, formatted cleanly as '£X - £Y' (e.g. £50,000 - £54,999). Do NOT include 'per annum', 'per year', or the word 'to' (use a hyphen instead). Use null if not available.",
  "email": "string email or null",
  "phone_number": "string phone number or null"
}}
DO NOT include any markdown formatting (like ```json), DO NOT include any introductory or concluding text. JUST output the raw JSON object.
"""

        try:
            max_retries = 3


            for attempt in range(max_retries):


                try:
                    # Note: We enforce a timeout on the client level now, but network issues can still raise exceptions
                    response = self.client.chat.completions.create(
                        model=self.model,
                        messages=[
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": f"Please evaluate this candidate CV:\n\n{cv_text}"}
                        ],
                        temperature=0.1,
                        response_format={"type": "json_object"}
                    )
    
                    raw_response = response.choices[0].message.content.strip()
                
                    # The API should return strict JSON because we used response_format={"type": "json_object"}
                    # But just in case, we do a basic cleanup
                    if raw_response.startswith("```json"):
                        raw_response = raw_response.replace("```json", "", 1)
                    if raw_response.endswith("```"):
                        raw_response = raw_response[:-3]
                    
                    raw_response = raw_response.strip()
    
                    result = json.loads(raw_response)
                
                    # Ensure proper keys exist
                    if "classification" not in result or "reasoning" not in result:
                        raise ValueError("JSON response missing 'classification' or 'reasoning' keys.")
    
                    logger.info(f"Classification Result for {expected_name}: {result['classification']}")
                    logger.info(f"Reasoning: {result['reasoning']}")
                
                    return result


                except Exception as e:


                    logger.warning(f"AI Classification failed on attempt {attempt + 1} for {expected_name}: {str(e)}")


                    if attempt < max_retries - 1:


                        time.sleep(2)


                    else:


                        logger.error(f"All {max_retries} classification attempts failed for {expected_name}.")


                        raise e

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response from OpenAI for {expected_name}. Raw response was: {raw_response}")
            return {
                "classification": "ERROR",
                "reasoning": f"JSON Decode Error: {str(e)}"
            }
        except Exception as e:
            # We explicitly catch timeout/connection errors so the script doesn't freeze
            logger.error(f"OpenAI API Error for {expected_name}: {str(e)}")
            return {
                "classification": "ERROR",
                "reasoning": f"API Request Failed: {str(e)}"
            }

    def pre_classify_candidate(self, preview_text, expected_name="Unknown"):
        logger.info(f"Starting Pre-Screening LLM evaluation for: {expected_name}...")
        
        system_prompt = """
You are a specialist recruitment pre-screening AI for Bid and Proposal roles within the Construction sector.
Your job is to analyze the candidate's visible card preview snippet (metadata, recent experience summary, desired role, and current status) from a recruiter portal and decide if the candidate is a potential FIT or UNFIT.
Since we pay money to unlock their full CV, we want to reject any candidate who is clearly UNFIT at this stage to save costs.

STRICT CLASSIFICATION CRITERIA:
1. ONLY pre-classify as FIT if the candidate shows clear potential of being a white-collar Bid or Proposal specialist (e.g. Bid Writer, Bid Coordinator, Bid Manager, Proposal Manager, Bid Lead, Head of Bids, Bid Director, PQQ Coordinator) within the construction/subcontracting industry.
2. IMMEDIATELY pre-classify as UNFIT if:
   - The candidate is a blue-collar worker / manual labourer / site worker (e.g. Carpenter, Erector, Welder, Installer, Fabricator, Operative).
   - The candidate's primary experience is in an unrelated sector (e.g. IT, logistics, finance, retail, general sales, general admin not related to bids).
   - The candidate works primarily outside of construction/engineering bid management.

If you are unsure but they have a strong bid writing/proposal coordination background within construction, classify as FIT so we can inspect the full CV.

Return output ONLY in valid JSON format:
{
  "classification": "FIT or UNFIT",
  "reasoning": "A concise paragraph explaining your pre-screening decision based on the visible experience."
}
"""

        user_prompt = f"""
CANDIDATE: {expected_name}
CARD PREVIEW TEXT:
{preview_text}

Return JSON output.
"""
        
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    response_format={ "type": "json_object" },
                    temperature=0.1
                )
                
                ai_data = json.loads(response.choices[0].message.content)
                classification = ai_data.get('classification', 'UNFIT')
                
                logger.info(f"[PRE-DECISION] {expected_name}: {classification}")
                logger.info(f"Pre-Screening Reasoning: {ai_data.get('reasoning')}")
                
                return ai_data
                
            except Exception as e:
                logger.warning(f"AI Pre-Screening Error on attempt {attempt + 1}/{max_retries} for {expected_name}: {e}")
                if attempt < max_retries - 1:
                    time.sleep(20) # Wait 20 seconds for rate limits to reset
                else:
                    logger.error(f"AI Pre-Screening completely failed for {expected_name} after {max_retries} attempts.")
                    err_str = str(e).lower()
                    if any(x in err_str for x in ["insufficient_quota", "balance", "billing", "429", "402", "credit", "rate limit reached", "too many requests"]):
                        return {
                            "classification": "TOKEN_ERROR",
                            "error_type": "TOKEN_LIMIT",
                            "reasoning": f"Token limit / billing balance reached: {str(e)}"
                        }
                    return {
                        "classification": "UNFIT",
                        "reasoning": f"AI Pre-Screening Logic Failure: {str(e)}"
                    }
