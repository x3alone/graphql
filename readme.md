graph needs to add a circle hover in the svg (title) 
to show the name of the project when the svg goes up in the line and shows the amount of xp added
{
  transaction(
    where: {
      _and: [
        { type: { _eq: "xp" } },
        { object: { type: { _eq: "project" } } }
      ]
    }
  ) {
    amount
    object {
      name
    }
  }
}