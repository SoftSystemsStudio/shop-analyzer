export async function saveToXano(analysisData: any) {
  try {console.log("Xano URL is:", process.env.XANO_URL);

    const res = await fetch(`${process.env.XANO_URL}/analysis`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.XANO_API_KEY}`,
      },
      body: JSON.stringify(analysisData),
    });

    if (!res.ok) {
      console.error("Xano error:", await res.text());
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error("Failed to save to Xano", err);
    return null;
  }
}
